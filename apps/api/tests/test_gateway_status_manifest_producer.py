from __future__ import annotations

import importlib.util
import json
import stat
import subprocess
from pathlib import Path


def _load_producer_module():
    module_path = Path(__file__).resolve().parents[3] / 'scripts' / 'write-gateway-status.py'
    spec = importlib.util.spec_from_file_location('write_gateway_status', module_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FakeSystemctl:
    def __init__(self, active_by_slug: dict[str, bool]) -> None:
        self.active_by_slug = active_by_slug
        self.commands: list[tuple[str, ...]] = []

    def __call__(self, command: list[str]) -> subprocess.CompletedProcess[str]:
        self.commands.append(tuple(command))
        assert command[:3] == ['systemctl', '--user', 'is-active']
        assert len(command) == 4
        unit = command[3]
        assert unit.startswith('hermes-gateway-')
        assert unit.endswith('.service')
        slug = unit.removeprefix('hermes-gateway-').removesuffix('.service')
        active = self.active_by_slug.get(slug, False)
        return subprocess.CompletedProcess(command, 0 if active else 3, 'active\n' if active else 'inactive\n', '')


def test_gateway_status_manifest_producer_writes_minimal_safe_atomic_json(tmp_path):
    producer = _load_producer_module()
    output = tmp_path / 'runtime' / 'healthcheck' / 'gateway-status.json'
    fake_systemctl = FakeSystemctl({slug: True for slug in producer.MUGIWARA_GATEWAY_SLUGS})

    result = producer.write_gateway_status(
        output_path=output,
        now='2026-04-25T21:00:00Z',
        systemctl_runner=fake_systemctl,
    )

    assert result['status'] == 'success'
    assert result['result'] == 'success'
    assert result['updated_at'] == '2026-04-25T21:00:00Z'
    assert set(result) == {'status', 'result', 'updated_at', 'gateways'}
    assert set(result['gateways']) == set(producer.MUGIWARA_GATEWAY_SLUGS)
    assert all(entry == {'active': True} for entry in result['gateways'].values())
    assert len(fake_systemctl.commands) == len(producer.MUGIWARA_GATEWAY_SLUGS)

    manifest = json.loads(output.read_text(encoding='utf-8'))
    assert manifest == result
    serialized = json.dumps(manifest)
    for forbidden in [
        'pid',
        'journal',
        'unit_content',
        'ExecStart',
        'command',
        'stdout',
        'stderr',
        'raw_output',
        'environment',
        'TOKEN',
        '.env',
        '/srv/crew-core',
        'hermes-gateway-luffy.service',
    ]:
        assert forbidden not in serialized
    assert output.parent.stat().st_mode & stat.S_IROTH == 0
    assert output.stat().st_mode & stat.S_IROTH == 0


def test_gateway_status_manifest_producer_degrades_inactive_gateway_without_leaking_unit_details(tmp_path):
    producer = _load_producer_module()
    output = tmp_path / 'runtime' / 'healthcheck' / 'gateway-status.json'
    fake_systemctl = FakeSystemctl({slug: True for slug in producer.MUGIWARA_GATEWAY_SLUGS})
    fake_systemctl.active_by_slug['zoro'] = False

    result = producer.write_gateway_status(
        output_path=output,
        now='2026-04-25T21:05:00Z',
        systemctl_runner=fake_systemctl,
    )

    assert result['status'] == 'failed'
    assert result['result'] == 'failed'
    assert result['gateways']['zoro'] == {'active': False}
    assert result['gateways']['luffy'] == {'active': True}
    serialized = output.read_text(encoding='utf-8')
    assert 'hermes-gateway-zoro.service' not in serialized
    assert 'inactive' not in serialized
    assert 'systemctl' not in serialized
    assert 'stdout' not in serialized


def test_gateway_status_manifest_producer_cli_accepts_safe_manual_output_and_now(tmp_path):
    producer = _load_producer_module()
    output = tmp_path / 'gateway-status.json'
    fake_systemctl = FakeSystemctl({slug: True for slug in producer.MUGIWARA_GATEWAY_SLUGS})

    exit_code = producer.main(['--output', str(output), '--now', '2026-04-25T21:10:00Z'], systemctl_runner=fake_systemctl)

    assert exit_code == 0
    manifest = json.loads(output.read_text(encoding='utf-8'))
    assert manifest['status'] == 'success'
    assert manifest['updated_at'] == '2026-04-25T21:10:00Z'


def test_gateway_status_manifest_producer_fsyncs_parent_directory_after_replace(tmp_path, monkeypatch):
    producer = _load_producer_module()
    output = tmp_path / 'runtime' / 'healthcheck' / 'gateway-status.json'
    fake_systemctl = FakeSystemctl({slug: True for slug in producer.MUGIWARA_GATEWAY_SLUGS})
    opened_dirs: list[str] = []
    fsynced_fds: list[int] = []
    closed_fds: list[int] = []
    real_open = producer.os.open
    real_close = producer.os.close

    def tracking_open(path, flags, *args, **kwargs):
        fd = real_open(path, flags, *args, **kwargs)
        if Path(path) == output.parent and flags & producer.os.O_DIRECTORY:
            opened_dirs.append(str(path))
        return fd

    def tracking_fsync(fd):
        fsynced_fds.append(fd)

    def tracking_close(fd):
        closed_fds.append(fd)
        return real_close(fd)

    monkeypatch.setattr(producer.os, 'open', tracking_open)
    monkeypatch.setattr(producer.os, 'fsync', tracking_fsync)
    monkeypatch.setattr(producer.os, 'close', tracking_close)

    producer.write_gateway_status(
        output_path=output,
        now='2026-04-25T21:15:00Z',
        systemctl_runner=fake_systemctl,
    )

    assert opened_dirs == [str(output.parent)]
    assert fsynced_fds
    assert fsynced_fds[-1] in closed_fds

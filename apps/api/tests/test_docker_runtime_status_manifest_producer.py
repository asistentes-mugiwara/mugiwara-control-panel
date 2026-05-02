from __future__ import annotations

import importlib.util
import json
import stat
import subprocess
from pathlib import Path


def _load_producer_module():
    module_path = Path(__file__).resolve().parents[3] / 'scripts' / 'write-docker-runtime-status.py'
    spec = importlib.util.spec_from_file_location('write_docker_runtime_status', module_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FakeDocker:
    def __init__(self, rows: list[dict[str, str]], returncode: int = 0) -> None:
        self.rows = rows
        self.returncode = returncode
        self.commands: list[tuple[str, ...]] = []

    def __call__(self, command: list[str]) -> subprocess.CompletedProcess[str]:
        self.commands.append(tuple(command))
        assert command == ['docker', 'ps', '-a', '--format', '{{json .}}']
        stdout = '\n'.join(json.dumps(row) for row in self.rows)
        return subprocess.CompletedProcess(command, self.returncode, stdout, 'secret stderr token')


def test_docker_runtime_manifest_producer_writes_allowlisted_safe_counts(tmp_path):
    producer = _load_producer_module()
    output = tmp_path / 'runtime' / 'healthcheck' / 'docker-runtime-status.json'
    fake_docker = FakeDocker(
        [
            {'Names': 'honcho-api', 'State': 'running', 'Status': 'Up 5 days', 'Mounts': '/srv/crew-core', 'ID': 'abc'},
            {'Names': 'honcho-database', 'State': 'running', 'Status': 'Up 5 days (healthy)', 'Env': 'TOKEN=secret'},
            {'Names': 'honcho-redis', 'State': 'running', 'Status': 'Up 5 days (healthy)', 'Labels': 'secret=true'},
            {'Names': 'unrelated', 'State': 'running', 'Status': 'Up 1 day (healthy)'},
        ]
    )

    result = producer.write_docker_runtime_status(output_path=output, now='2026-05-02T10:00:00Z', docker_runner=fake_docker)

    assert result == {
        'status': 'success',
        'result': 'success',
        'updated_at': '2026-05-02T10:00:00Z',
        'containers': {
            'honcho-api': {'running': True, 'health': 'none'},
            'honcho-database': {'running': True, 'health': 'healthy'},
            'honcho-redis': {'running': True, 'health': 'healthy'},
        },
    }
    assert json.loads(output.read_text(encoding='utf-8')) == result
    serialized = output.read_text(encoding='utf-8')
    for forbidden in ['Mounts', 'Env', 'Labels', '/srv/crew-core', 'TOKEN', 'secret', 'abc', 'unrelated', 'stderr', 'docker ps']:
        assert forbidden not in serialized
    assert output.parent.stat().st_mode & stat.S_IROTH == 0
    assert output.stat().st_mode & stat.S_IROTH == 0


def test_docker_runtime_manifest_producer_fails_closed_for_missing_or_unhealthy_container(tmp_path):
    producer = _load_producer_module()
    output = tmp_path / 'docker-runtime-status.json'
    fake_docker = FakeDocker(
        [
            {'Names': 'honcho-api', 'State': 'running', 'Status': 'Up 5 days'},
            {'Names': 'honcho-database', 'State': 'exited', 'Status': 'Exited (1) TOKEN'},
            {'Names': 'honcho-redis', 'State': 'running', 'Status': 'Up 5 days (unhealthy)'},
        ]
    )

    result = producer.write_docker_runtime_status(output_path=output, now='2026-05-02T10:05:00Z', docker_runner=fake_docker)

    assert result['status'] == 'failed'
    assert result['containers']['honcho-api'] == {'running': True, 'health': 'none'}
    assert result['containers']['honcho-database'] == {'running': False, 'health': 'none'}
    assert result['containers']['honcho-redis'] == {'running': True, 'health': 'unhealthy'}
    serialized = output.read_text(encoding='utf-8')
    assert 'Exited' not in serialized
    assert 'TOKEN' not in serialized


def test_docker_runtime_manifest_producer_cli_accepts_safe_output_and_now(tmp_path):
    producer = _load_producer_module()
    output = tmp_path / 'docker-runtime-status.json'
    fake_docker = FakeDocker([
        {'Names': 'honcho-api', 'State': 'running', 'Status': 'Up'},
        {'Names': 'honcho-database', 'State': 'running', 'Status': 'Up (healthy)'},
        {'Names': 'honcho-redis', 'State': 'running', 'Status': 'Up (healthy)'},
    ])

    exit_code = producer.main(['--output', str(output), '--now', '2026-05-02T10:10:00Z'], docker_runner=fake_docker)

    assert exit_code == 0
    assert json.loads(output.read_text(encoding='utf-8'))['status'] == 'success'

from __future__ import annotations

import importlib.util
import json
import os
import stat
from pathlib import Path


def _load_producer_module():
    module_path = Path(__file__).resolve().parents[3] / 'scripts' / 'write-vault-sync-status.py'
    spec = importlib.util.spec_from_file_location('write_vault_sync_status', module_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _fake_sync_script(path: Path, *, exit_code: int = 0, content: str = '') -> Path:
    script = path / 'vault-sync.sh'
    script.write_text(
        '#!/usr/bin/env bash\n'
        'printf "%s" "$SYNTHETIC_SYNC_OUTPUT"\n'
        f'exit {exit_code}\n',
        encoding='utf-8',
    )
    script.chmod(0o750)
    os.environ['SYNTHETIC_SYNC_OUTPUT'] = content
    return script


def test_vault_sync_status_producer_writes_success_manifest_without_raw_output(tmp_path):
    producer = _load_producer_module()
    sync_script = _fake_sync_script(
        tmp_path,
        exit_code=0,
        content='Sync complete /srv/crew-core/vault origin main token secret stdout stderr',
    )
    output = tmp_path / 'runtime' / 'healthcheck' / 'vault-sync-status.json'

    result = producer.write_vault_sync_status(
        sync_script=sync_script,
        output_path=output,
        now='2026-04-27T08:15:00Z',
    )

    assert result == {
        'status': 'success',
        'result': 'success',
        'updated_at': '2026-04-27T08:15:00Z',
        'last_success_at': '2026-04-27T08:15:00Z',
    }
    manifest = json.loads(output.read_text(encoding='utf-8'))
    assert manifest == result
    assert set(manifest) == {'status', 'result', 'updated_at', 'last_success_at'}
    serialized = json.dumps(manifest)
    for forbidden in ('/srv/crew-core/vault', 'origin', 'main', 'token', 'secret', 'stdout', 'stderr', 'Sync complete'):
        assert forbidden not in serialized
    assert stat.S_IMODE(output.parent.stat().st_mode) == 0o750
    assert stat.S_IMODE(output.stat().st_mode) == 0o640


def test_vault_sync_status_producer_writes_failed_manifest_without_leaking_failure_output(tmp_path):
    producer = _load_producer_module()
    sync_script = _fake_sync_script(
        tmp_path,
        exit_code=2,
        content='STOP: remote diverged /private/path stdout stderr token secret',
    )
    output = tmp_path / 'runtime' / 'healthcheck' / 'vault-sync-status.json'

    result = producer.write_vault_sync_status(
        sync_script=sync_script,
        output_path=output,
        now='2026-04-27T08:20:00Z',
    )

    assert result == {
        'status': 'failed',
        'result': 'failed',
        'updated_at': '2026-04-27T08:20:00Z',
    }
    serialized = output.read_text(encoding='utf-8')
    for forbidden in ('remote diverged', '/private/path', 'stdout', 'stderr', 'token', 'secret'):
        assert forbidden not in serialized


def test_vault_sync_status_producer_degrades_missing_source_to_failed(tmp_path):
    producer = _load_producer_module()
    output = tmp_path / 'runtime' / 'healthcheck' / 'vault-sync-status.json'

    result = producer.write_vault_sync_status(
        sync_script=tmp_path / 'missing-vault-sync.sh',
        output_path=output,
        now='2026-04-27T08:25:00Z',
    )

    assert result == {
        'status': 'failed',
        'result': 'failed',
        'updated_at': '2026-04-27T08:25:00Z',
    }
    assert json.loads(output.read_text(encoding='utf-8')) == result


def test_vault_sync_status_producer_cli_accepts_controlled_paths(tmp_path):
    producer = _load_producer_module()
    sync_script = _fake_sync_script(tmp_path, exit_code=0, content='No local changes to sync. origin main')
    output = tmp_path / 'status.json'

    exit_code = producer.main([
        '--sync-script',
        str(sync_script),
        '--output',
        str(output),
        '--now',
        '2026-04-27T08:30:00Z',
    ])

    assert exit_code == 0
    manifest = json.loads(output.read_text(encoding='utf-8'))
    assert manifest['status'] == 'success'
    assert manifest['last_success_at'] == '2026-04-27T08:30:00Z'


def test_vault_sync_status_producer_cli_returns_nonzero_after_writing_failed_manifest(tmp_path):
    producer = _load_producer_module()
    sync_script = _fake_sync_script(tmp_path, exit_code=1, content='ERROR raw host detail')
    output = tmp_path / 'status.json'

    exit_code = producer.main([
        '--sync-script',
        str(sync_script),
        '--output',
        str(output),
        '--now',
        '2026-04-27T08:35:00Z',
    ])

    assert exit_code == 1
    manifest = json.loads(output.read_text(encoding='utf-8'))
    assert manifest == {
        'status': 'failed',
        'result': 'failed',
        'updated_at': '2026-04-27T08:35:00Z',
    }
    assert 'raw host detail' not in output.read_text(encoding='utf-8')

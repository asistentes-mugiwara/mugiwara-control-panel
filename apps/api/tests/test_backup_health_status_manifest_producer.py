from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import stat
from datetime import datetime, timezone
from pathlib import Path


def _load_producer_module():
    module_path = Path(__file__).resolve().parents[3] / 'scripts' / 'write-backup-health-status.py'
    spec = importlib.util.spec_from_file_location('write_backup_health_status', module_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _write_backup_pair(backups_dir: Path, name: str, content: bytes = b'backup', *, checksum: bool = True, valid_checksum: bool = True) -> Path:
    archive = backups_dir / name
    archive.write_bytes(content)
    if checksum:
        digest = hashlib.sha256(content if valid_checksum else b'different').hexdigest()
        (backups_dir / f'{name}.sha256').write_text(f'{digest}  {archive}\n', encoding='utf-8')
    return archive


def _serialized(path: Path) -> str:
    return path.read_text(encoding='utf-8')


def test_backup_health_status_producer_writes_success_for_recent_backup_with_checksum_and_retention(tmp_path):
    producer = _load_producer_module()
    backups_dir = tmp_path / 'backups'
    backups_dir.mkdir()
    for idx in range(4):
        archive = _write_backup_pair(backups_dir, f'mugiwara-backup-private-{idx}.tar.zst', f'payload-{idx}'.encode())
        os.utime(archive, (1_777_777_000 + idx, 1_777_777_000 + idx))
    output = tmp_path / 'runtime' / 'healthcheck' / 'backup-health-status.json'

    result = producer.write_backup_health_status(
        backups_dir=backups_dir,
        output_path=output,
        now='2026-04-27T09:15:00Z',
    )

    assert result == {
        'status': 'success',
        'result': 'success',
        'updated_at': '2026-04-27T09:15:00Z',
        'last_success_at': datetime.fromtimestamp(1_777_777_003, timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
        'checksum_present': True,
        'retention_count': 4,
    }
    assert json.loads(output.read_text(encoding='utf-8')) == result
    assert stat.S_IMODE(output.parent.stat().st_mode) == 0o750
    assert stat.S_IMODE(output.stat().st_mode) == 0o640



def test_backup_health_status_producer_degrades_when_latest_checksum_is_absent_or_invalid(tmp_path):
    producer = _load_producer_module()
    backups_dir = tmp_path / 'backups'
    backups_dir.mkdir()
    for idx in range(3):
        _write_backup_pair(backups_dir, f'mugiwara-backup-old-{idx}.tar.zst', b'ok')
    latest = _write_backup_pair(backups_dir, 'mugiwara-backup-latest.tar.zst', b'latest', checksum=False)
    os.utime(latest, (1_777_777_100, 1_777_777_100))
    output = tmp_path / 'status.json'

    result = producer.write_backup_health_status(backups_dir=backups_dir, output_path=output, now='2026-04-27T09:20:00Z')

    assert result['status'] == 'warning'
    assert result['result'] == 'warning'
    assert result['checksum_present'] is False
    assert result['retention_count'] == 4
    assert 'last_success_at' not in result

    (backups_dir / 'mugiwara-backup-latest.tar.zst.sha256').write_text('0' * 64 + f'  {latest}\n', encoding='utf-8')
    result = producer.write_backup_health_status(backups_dir=backups_dir, output_path=output, now='2026-04-27T09:21:00Z')
    assert result['status'] == 'warning'
    assert result['checksum_present'] is False
    assert 'last_success_at' not in result



def test_backup_health_status_producer_degrades_when_retention_is_insufficient(tmp_path):
    producer = _load_producer_module()
    backups_dir = tmp_path / 'backups'
    backups_dir.mkdir()
    _write_backup_pair(backups_dir, 'mugiwara-backup-only.tar.zst', b'only')
    output = tmp_path / 'status.json'

    result = producer.write_backup_health_status(backups_dir=backups_dir, output_path=output, now='2026-04-27T09:25:00Z')

    assert result == {
        'status': 'warning',
        'result': 'warning',
        'updated_at': '2026-04-27T09:25:00Z',
        'checksum_present': True,
        'retention_count': 1,
    }



def test_backup_health_status_producer_degrades_missing_unreadable_or_partial_source(tmp_path):
    producer = _load_producer_module()
    output = tmp_path / 'status.json'

    missing = producer.write_backup_health_status(backups_dir=tmp_path / 'missing', output_path=output, now='2026-04-27T09:30:00Z')
    assert missing == {
        'status': 'failed',
        'result': 'failed',
        'updated_at': '2026-04-27T09:30:00Z',
        'checksum_present': False,
        'retention_count': 0,
    }

    backups_dir = tmp_path / 'empty'
    backups_dir.mkdir()
    empty = producer.write_backup_health_status(backups_dir=backups_dir, output_path=output, now='2026-04-27T09:31:00Z')
    assert empty['status'] == 'failed'
    assert empty['checksum_present'] is False
    assert empty['retention_count'] == 0



def test_backup_health_status_producer_no_leakage_from_sensitive_fixture(tmp_path):
    producer = _load_producer_module()
    backups_dir = tmp_path / 'private-backups'
    backups_dir.mkdir()
    sensitive_name = 'mugiwara-backup-secret-token-drive-target-abc123.tar.zst'
    archive = _write_backup_pair(
        backups_dir,
        sensitive_name,
        b'/srv/crew-core .env stdout stderr raw_output token credential drive-id hash deadbeef',
    )
    for idx in range(3):
        _write_backup_pair(backups_dir, f'mugiwara-backup-old-sensitive-{idx}.tar.zst', b'old')
    os.utime(archive, (1_777_777_200, 1_777_777_200))
    output = tmp_path / 'runtime' / 'healthcheck' / 'backup-health-status.json'

    result = producer.write_backup_health_status(backups_dir=backups_dir, output_path=output, now='2026-04-27T09:35:00Z')

    assert result['status'] == 'success'
    serialized = _serialized(output)
    for forbidden in (
        str(backups_dir),
        sensitive_name,
        'secret-token',
        'drive-target',
        '/srv/crew-core',
        '.env',
        'stdout',
        'stderr',
        'raw_output',
        'token',
        'credential',
        'drive-id',
        'deadbeef',
        'hash',
    ):
        assert forbidden not in serialized



def test_backup_health_status_producer_rejects_unsafe_manifest_shape(tmp_path):
    producer = _load_producer_module()
    output = tmp_path / 'status.json'

    try:
        producer._write_atomic_json(output, {'status': 'success', 'result': 'success', 'updated_at': '2026-04-27T09:40:00Z'})
    except producer.BackupHealthStatusProducerError:
        pass
    else:
        raise AssertionError('unsafe partial backup manifest was accepted')



def test_backup_health_status_producer_cli_accepts_controlled_paths(tmp_path):
    producer = _load_producer_module()
    backups_dir = tmp_path / 'backups'
    backups_dir.mkdir()
    for idx in range(4):
        _write_backup_pair(backups_dir, f'mugiwara-backup-{idx}.tar.zst', b'ok')
    output = tmp_path / 'status.json'

    exit_code = producer.main([
        '--backups-dir',
        str(backups_dir),
        '--output',
        str(output),
        '--now',
        '2026-04-27T09:45:00Z',
    ])

    assert exit_code == 0
    assert json.loads(output.read_text(encoding='utf-8'))['status'] == 'success'



def test_backup_health_status_producer_cli_returns_nonzero_after_writing_degraded_manifest(tmp_path):
    producer = _load_producer_module()
    backups_dir = tmp_path / 'backups'
    backups_dir.mkdir()
    _write_backup_pair(backups_dir, 'mugiwara-backup-only.tar.zst', b'ok')
    output = tmp_path / 'status.json'

    exit_code = producer.main([
        '--backups-dir',
        str(backups_dir),
        '--output',
        str(output),
        '--now',
        '2026-04-27T09:50:00Z',
    ])

    assert exit_code == 1
    manifest = json.loads(output.read_text(encoding='utf-8'))
    assert manifest['status'] == 'warning'
    assert manifest['retention_count'] == 1

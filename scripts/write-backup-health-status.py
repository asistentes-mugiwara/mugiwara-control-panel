#!/usr/bin/env python3
"""Write the safe backup-health Healthcheck manifest.

This producer is intentionally outside the backend Healthcheck module. It observes
only the fixed local backup artifact directory created by Franky's reviewed system
backup flow and writes the minimal semantics consumed later by
BackupHealthManifestAdapter. It never runs a backup and never serializes archive
names, paths, sizes, hashes, logs or raw command output.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Sequence

DEFAULT_BACKUPS_DIR = Path('/srv/crew-core/backups')
DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/backup-health-status.json')
SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'last_success_at', 'checksum_present', 'retention_count')
DEGRADED_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'checksum_present', 'retention_count')
EXPECTED_RETENTION_COUNT = 4


class BackupHealthStatusProducerError(RuntimeError):
    """Raised when the producer cannot write a safe manifest."""


def write_backup_health_status(
    *,
    backups_dir: Path = DEFAULT_BACKUPS_DIR,
    output_path: Path = DEFAULT_OUTPUT_PATH,
    now: str | datetime | None = None,
) -> dict[str, object]:
    source_dir = backups_dir.resolve()
    output = output_path.resolve()
    updated_at = _safe_timestamp(now)

    state = _inspect_backup_artifacts(source_dir)
    status = _derive_status(
        retention_count=state['retention_count'],
        checksum_present=state['checksum_present'],
    )

    manifest: dict[str, object] = {
        'status': status,
        'result': status,
        'updated_at': updated_at,
    }
    if status == 'success' and isinstance(state['last_success_at'], str):
        manifest['last_success_at'] = state['last_success_at']
    manifest['checksum_present'] = state['checksum_present']
    manifest['retention_count'] = state['retention_count']

    _write_atomic_json(output, manifest)
    return manifest


def _inspect_backup_artifacts(backups_dir: Path) -> dict[str, object]:
    if not backups_dir.is_dir():
        return {'retention_count': 0, 'checksum_present': False, 'last_success_at': None}

    try:
        archives = [entry for entry in backups_dir.iterdir() if entry.is_file() and entry.name.startswith('mugiwara-backup-') and entry.name.endswith('.tar.zst')]
    except OSError:
        return {'retention_count': 0, 'checksum_present': False, 'last_success_at': None}

    retention_count = len(archives)
    if not archives:
        return {'retention_count': 0, 'checksum_present': False, 'last_success_at': None}

    try:
        latest_archive = max(archives, key=lambda path: (path.stat().st_mtime, path.name))
        last_success_at = _timestamp_from_epoch(latest_archive.stat().st_mtime)
    except OSError:
        return {'retention_count': retention_count, 'checksum_present': False, 'last_success_at': None}

    checksum_present = _checksum_is_present_and_valid(latest_archive)
    return {
        'retention_count': retention_count,
        'checksum_present': checksum_present,
        'last_success_at': last_success_at if checksum_present else None,
    }


def _checksum_is_present_and_valid(archive: Path) -> bool:
    checksum_path = archive.with_name(f'{archive.name}.sha256')
    if not checksum_path.is_file():
        return False

    try:
        result = subprocess.run(
            ['sha256sum', '-c', str(checksum_path)],
            check=False,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=60,
        )
    except (OSError, subprocess.TimeoutExpired):
        return False
    return result.returncode == 0


def _derive_status(*, retention_count: int, checksum_present: bool) -> str:
    if retention_count <= 0:
        return 'failed'
    if checksum_present is not True:
        return 'warning'
    if retention_count < EXPECTED_RETENTION_COUNT:
        return 'warning'
    return 'success'


def _safe_timestamp(value: str | datetime | None) -> str:
    if value is None:
        moment = datetime.now(timezone.utc)
    elif isinstance(value, datetime):
        moment = value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
    else:
        normalized = value.replace('Z', '+00:00') if value.endswith('Z') else value
        moment = datetime.fromisoformat(normalized)
        if moment.tzinfo is None:
            moment = moment.replace(tzinfo=timezone.utc)
    return moment.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def _timestamp_from_epoch(epoch_seconds: float) -> str:
    return datetime.fromtimestamp(epoch_seconds, timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def _write_atomic_json(output: Path, manifest: dict[str, object]) -> None:
    keys = tuple(manifest.keys())
    if keys not in (SAFE_MANIFEST_KEYS, DEGRADED_MANIFEST_KEYS):
        raise BackupHealthStatusProducerError('unsafe manifest shape')
    if manifest.get('status') != manifest.get('result'):
        raise BackupHealthStatusProducerError('unsafe manifest semantics')
    if manifest.get('status') != 'success' and 'last_success_at' in manifest:
        raise BackupHealthStatusProducerError('unsafe success timestamp')
    if not isinstance(manifest.get('checksum_present'), bool):
        raise BackupHealthStatusProducerError('unsafe checksum semantics')
    retention_count = manifest.get('retention_count')
    if isinstance(retention_count, bool) or not isinstance(retention_count, int) or retention_count < 0:
        raise BackupHealthStatusProducerError('unsafe retention semantics')
    if manifest.get('status') == 'success':
        if manifest.get('checksum_present') is not True or retention_count < EXPECTED_RETENTION_COUNT:
            raise BackupHealthStatusProducerError('unsafe green backup semantics')

    output.parent.mkdir(mode=0o750, parents=True, exist_ok=True)
    os.chmod(output.parent, 0o750)

    payload = json.dumps(manifest, ensure_ascii=False, separators=(',', ':'), sort_keys=False) + '\n'
    fd = -1
    temp_path = ''
    try:
        fd, temp_path = tempfile.mkstemp(prefix='.backup-health-status.', suffix='.tmp', dir=output.parent)
        with os.fdopen(fd, 'w', encoding='utf-8') as handle:
            fd = -1
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temp_path, 0o640)
        os.replace(temp_path, output)
        os.chmod(output, 0o640)
        _fsync_directory(output.parent)
    except OSError as exc:
        if fd >= 0:
            os.close(fd)
        if temp_path:
            try:
                os.unlink(temp_path)
            except FileNotFoundError:
                pass
        raise BackupHealthStatusProducerError('manifest could not be written atomically') from exc


def _fsync_directory(directory: Path) -> None:
    directory_fd = os.open(directory, os.O_RDONLY)
    try:
        os.fsync(directory_fd)
    finally:
        os.close(directory_fd)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description='Write safe backup-health Healthcheck manifest.')
    parser.add_argument('--backups-dir', type=Path, default=DEFAULT_BACKUPS_DIR, help='Fixed local backup artifact directory to inspect.')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT_PATH, help='Manifest path to write atomically.')
    parser.add_argument('--now', default=None, help='Optional ISO timestamp for deterministic tests.')
    args = parser.parse_args(argv)

    manifest = write_backup_health_status(backups_dir=args.backups_dir, output_path=args.output, now=args.now)
    print(
        'backup-health manifest written '
        f"status={manifest['status']} "
        f"checksum_present={str(manifest['checksum_present']).lower()} "
        f"retention_count={manifest['retention_count']}"
    )
    return 0 if manifest['status'] == 'success' else 1


if __name__ == '__main__':
    raise SystemExit(main())

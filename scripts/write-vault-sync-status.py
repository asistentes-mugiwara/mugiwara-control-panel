#!/usr/bin/env python3
"""Write the safe vault-sync Healthcheck manifest.

This producer is intentionally outside the backend Healthcheck module. It may run
Franky's reviewed vault sync script as the operational source, but the manifest it
writes contains only status/result/timestamp semantics consumed later by
VaultSyncManifestAdapter.
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

DEFAULT_SYNC_SCRIPT = Path('/srv/crew-core/scripts/vault-sync.sh')
DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/vault-sync-status.json')
SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'last_success_at')
DEGRADED_MANIFEST_KEYS = ('status', 'result', 'updated_at')


class VaultSyncStatusProducerError(RuntimeError):
    """Raised when the producer cannot write a safe manifest."""


def write_vault_sync_status(
    *,
    sync_script: Path = DEFAULT_SYNC_SCRIPT,
    output_path: Path = DEFAULT_OUTPUT_PATH,
    now: str | datetime | None = None,
    timeout_seconds: int = 600,
) -> dict[str, object]:
    output = output_path.resolve()
    updated_at = _safe_timestamp(now)

    status = _run_vault_sync(sync_script=sync_script, timeout_seconds=timeout_seconds)
    manifest: dict[str, object] = {
        'status': status,
        'result': status,
        'updated_at': updated_at,
    }
    if status == 'success':
        manifest['last_success_at'] = updated_at

    _write_atomic_json(output, manifest)
    return manifest


def _run_vault_sync(*, sync_script: Path, timeout_seconds: int) -> str:
    if timeout_seconds <= 0:
        raise VaultSyncStatusProducerError('invalid timeout')

    script = sync_script.resolve()
    if not script.is_file() or not os.access(script, os.X_OK):
        return 'failed'

    try:
        result = subprocess.run(
            [str(script)],
            check=False,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=timeout_seconds,
        )
    except (OSError, subprocess.TimeoutExpired):
        return 'failed'

    if result.returncode == 0:
        return 'success'
    return 'failed'


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


def _write_atomic_json(output: Path, manifest: dict[str, object]) -> None:
    keys = tuple(manifest.keys())
    if keys not in (SAFE_MANIFEST_KEYS, DEGRADED_MANIFEST_KEYS):
        raise VaultSyncStatusProducerError('unsafe manifest shape')
    if manifest.get('status') != manifest.get('result'):
        raise VaultSyncStatusProducerError('unsafe manifest semantics')
    if manifest.get('status') != 'success' and 'last_success_at' in manifest:
        raise VaultSyncStatusProducerError('unsafe success timestamp')

    output.parent.mkdir(mode=0o750, parents=True, exist_ok=True)
    os.chmod(output.parent, 0o750)

    payload = json.dumps(manifest, ensure_ascii=False, separators=(',', ':'), sort_keys=False) + '\n'
    fd = -1
    temp_path = ''
    try:
        fd, temp_path = tempfile.mkstemp(prefix='.vault-sync-status.', suffix='.tmp', dir=output.parent)
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
        raise VaultSyncStatusProducerError('manifest could not be written atomically') from exc


def _fsync_directory(directory: Path) -> None:
    directory_fd = os.open(directory, os.O_RDONLY)
    try:
        os.fsync(directory_fd)
    finally:
        os.close(directory_fd)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description='Write safe vault-sync Healthcheck manifest.')
    parser.add_argument('--sync-script', type=Path, default=DEFAULT_SYNC_SCRIPT, help='Reviewed vault sync script to run.')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT_PATH, help='Manifest path to write atomically.')
    parser.add_argument('--now', default=None, help='Optional ISO timestamp for deterministic tests.')
    parser.add_argument('--timeout-seconds', type=int, default=600, help='Maximum time allowed for the sync script.')
    args = parser.parse_args(argv)

    manifest = write_vault_sync_status(
        sync_script=args.sync_script,
        output_path=args.output,
        now=args.now,
        timeout_seconds=args.timeout_seconds,
    )
    print(f"vault-sync manifest written status={manifest['status']}")
    return 0 if manifest['status'] == 'success' else 1


if __name__ == '__main__':
    raise SystemExit(main())

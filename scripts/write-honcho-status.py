#!/usr/bin/env python3
"""Write the safe Honcho runtime Healthcheck manifest.

This producer is intentionally outside the backend Healthcheck module. It reads
only the already-sanitized Docker runtime manifest plus the local Honcho health
endpoint status, then writes API/DB/Redis booleans without credentials, paths,
ports, raw Docker details or endpoint payloads.
"""
from __future__ import annotations

import argparse
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Mapping, Sequence
from urllib import error, request

DEFAULT_DOCKER_RUNTIME_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/docker-runtime-status.json')
DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/honcho-status.json')
HONCHO_HEALTH_URL = 'http://127.0.0.1:8000/health'
SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'api', 'db', 'redis')
SAFE_SERVICE_ENTRY_KEYS = ('ok',)
Urlopen = Callable[..., object]


class HonchoStatusProducerError(RuntimeError):
    """Raised when the producer cannot compute or write a safe manifest."""


def write_honcho_status(
    *,
    docker_runtime_manifest: Path = DEFAULT_DOCKER_RUNTIME_MANIFEST,
    output_path: Path = DEFAULT_OUTPUT_PATH,
    now: str | datetime | None = None,
    urlopen: Urlopen | None = None,
) -> dict[str, object]:
    output = output_path.resolve()
    updated_at = _safe_timestamp(now)
    docker_manifest = _read_docker_runtime_manifest(docker_runtime_manifest)
    containers = docker_manifest.get('containers') if isinstance(docker_manifest, Mapping) else {}
    api_container_ok = _container_ok(containers, 'honcho-api')
    db_ok = _container_ok(containers, 'honcho-database')
    redis_ok = _container_ok(containers, 'honcho-redis')
    endpoint_ok = _honcho_endpoint_ok(urlopen or request.urlopen)
    api_ok = api_container_ok and endpoint_ok

    manifest: dict[str, object] = {
        'status': 'success' if api_ok and db_ok and redis_ok else 'failed',
        'result': 'success' if api_ok and db_ok and redis_ok else 'failed',
        'updated_at': updated_at,
        'api': {'ok': api_ok},
        'db': {'ok': db_ok},
        'redis': {'ok': redis_ok},
    }
    _write_atomic_json(output, manifest)
    return manifest


def _read_docker_runtime_manifest(path: Path) -> Mapping[object, object]:
    try:
        loaded = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HonchoStatusProducerError('docker runtime manifest could not be read safely') from exc
    if not isinstance(loaded, Mapping):
        raise HonchoStatusProducerError('unsafe docker runtime manifest shape')
    return loaded


def _container_ok(containers: object, name: str) -> bool:
    if not isinstance(containers, Mapping):
        return False
    entry = containers.get(name)
    if not isinstance(entry, Mapping):
        return False
    if entry.get('running') is not True:
        return False
    return entry.get('health') in {'healthy', 'none'}


def _honcho_endpoint_ok(urlopen: Urlopen) -> bool:
    try:
        with urlopen(HONCHO_HEALTH_URL, timeout=5) as response:
            status_code = getattr(response, 'status', None)
            body = response.read().decode('utf-8', errors='replace')
    except (OSError, error.URLError, TimeoutError):
        return False
    if status_code != 200:
        return False
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError:
        return False
    return isinstance(parsed, Mapping) and parsed.get('status') == 'ok'


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
    _validate_manifest_shape(manifest)
    output.parent.mkdir(mode=0o750, parents=True, exist_ok=True)
    os.chmod(output.parent, 0o750)
    payload = json.dumps(manifest, ensure_ascii=False, separators=(',', ':'), sort_keys=False) + '\n'
    fd = -1
    temp_path = ''
    try:
        fd, temp_path = tempfile.mkstemp(prefix='.honcho-status.', suffix='.tmp', dir=output.parent)
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
        raise HonchoStatusProducerError('manifest could not be written atomically') from exc


def _fsync_directory(directory: Path) -> None:
    dir_fd = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(dir_fd)
    finally:
        os.close(dir_fd)


def _validate_manifest_shape(manifest: dict[str, object]) -> None:
    if tuple(manifest.keys()) != SAFE_MANIFEST_KEYS:
        raise HonchoStatusProducerError('unsafe honcho manifest shape')
    for key in ('api', 'db', 'redis'):
        entry = manifest.get(key)
        if not isinstance(entry, dict) or tuple(entry.keys()) != SAFE_SERVICE_ENTRY_KEYS or not isinstance(entry['ok'], bool):
            raise HonchoStatusProducerError('unsafe honcho service entry shape')


def main(argv: Sequence[str] | None = None, *, urlopen: Urlopen | None = None) -> int:
    parser = argparse.ArgumentParser(description='Write safe Honcho runtime Healthcheck manifest.')
    parser.add_argument('--docker-runtime-manifest', type=Path, default=DEFAULT_DOCKER_RUNTIME_MANIFEST, help='Sanitized Docker runtime manifest path to read.')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT_PATH, help='Manifest path to write atomically.')
    parser.add_argument('--now', default=None, help='Optional ISO timestamp for deterministic tests.')
    args = parser.parse_args(argv)

    manifest = write_honcho_status(
        docker_runtime_manifest=args.docker_runtime_manifest,
        output_path=args.output,
        now=args.now,
        urlopen=urlopen,
    )
    ok_count = sum(1 for key in ('api', 'db', 'redis') if manifest[key]['ok'])  # type: ignore[index]
    print(f"honcho manifest written status={manifest['status']} ok={ok_count}/3")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

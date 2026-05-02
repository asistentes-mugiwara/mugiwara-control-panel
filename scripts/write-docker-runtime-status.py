#!/usr/bin/env python3
"""Write the safe Docker runtime Healthcheck manifest.

This producer is intentionally outside the backend Healthcheck module. It may
query Docker for a fixed allowlist of critical containers, but the manifest it
writes contains only timestamp/status and sanitized per-container state consumed
later by the Healthcheck read model.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Mapping, Sequence

DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/docker-runtime-status.json')
CRITICAL_CONTAINER_NAMES: tuple[str, ...] = (
    'honcho-api',
    'honcho-database',
    'honcho-redis',
)
SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'containers')
SAFE_CONTAINER_ENTRY_KEYS = ('running', 'health')
SAFE_HEALTH_VALUES = {'healthy', 'unhealthy', 'none', 'unknown'}
DockerRunner = Callable[[list[str]], subprocess.CompletedProcess[str]]


class DockerRuntimeStatusProducerError(RuntimeError):
    """Raised when the producer cannot compute or write a safe manifest."""


def write_docker_runtime_status(
    *,
    output_path: Path = DEFAULT_OUTPUT_PATH,
    now: str | datetime | None = None,
    docker_runner: DockerRunner | None = None,
) -> dict[str, object]:
    output = output_path.resolve()
    updated_at = _safe_timestamp(now)
    runner = docker_runner or _run_docker
    observed = _docker_ps_by_name(runner)

    containers: dict[str, dict[str, object]] = {}
    for name in CRITICAL_CONTAINER_NAMES:
        item = observed.get(name)
        running = bool(item and item.get('state') == 'running')
        health = _safe_health(item.get('health') if item else None)
        containers[name] = {'running': running, 'health': health}

    status = 'success' if all(_container_is_ok(entry) for entry in containers.values()) else 'failed'
    manifest: dict[str, object] = {
        'status': status,
        'result': status,
        'updated_at': updated_at,
        'containers': containers,
    }
    _write_atomic_json(output, manifest)
    return manifest


def _docker_ps_by_name(runner: DockerRunner) -> dict[str, dict[str, str]]:
    try:
        result = runner(['docker', 'ps', '-a', '--format', '{{json .}}'])
    except OSError as exc:
        raise DockerRuntimeStatusProducerError('docker runtime state could not be read safely') from exc
    if result.returncode != 0:
        raise DockerRuntimeStatusProducerError('docker runtime state could not be read safely')

    observed: dict[str, dict[str, str]] = {}
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue
        if not isinstance(item, Mapping):
            continue
        name = item.get('Names') or item.get('Name')
        if name not in CRITICAL_CONTAINER_NAMES:
            continue
        state = _safe_state(item.get('State'))
        status_text = item.get('Status') if isinstance(item.get('Status'), str) else ''
        observed[str(name)] = {'state': state, 'health': _health_from_status(status_text)}
    return observed


def _container_is_ok(entry: Mapping[str, object]) -> bool:
    if entry.get('running') is not True:
        return False
    health = entry.get('health')
    return health in {'healthy', 'none'}


def _safe_state(value: object) -> str:
    if not isinstance(value, str):
        return 'unknown'
    normalized = value.strip().lower()
    return normalized if normalized == 'running' else 'not_running'


def _health_from_status(status_text: str) -> str:
    lowered = status_text.lower()
    if '(healthy)' in lowered:
        return 'healthy'
    if '(unhealthy)' in lowered:
        return 'unhealthy'
    if '(health:' in lowered or 'starting' in lowered:
        return 'unknown'
    return 'none'


def _safe_health(value: object) -> str:
    if not isinstance(value, str):
        return 'unknown'
    normalized = value.strip().lower()
    return normalized if normalized in SAFE_HEALTH_VALUES else 'unknown'


def _run_docker(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


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
        fd, temp_path = tempfile.mkstemp(prefix='.docker-runtime-status.', suffix='.tmp', dir=output.parent)
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
        raise DockerRuntimeStatusProducerError('manifest could not be written atomically') from exc


def _fsync_directory(directory: Path) -> None:
    dir_fd = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(dir_fd)
    finally:
        os.close(dir_fd)


def _validate_manifest_shape(manifest: dict[str, object]) -> None:
    if tuple(manifest.keys()) != SAFE_MANIFEST_KEYS:
        raise DockerRuntimeStatusProducerError('unsafe docker runtime manifest shape')
    containers = manifest.get('containers')
    if not isinstance(containers, dict):
        raise DockerRuntimeStatusProducerError('unsafe docker runtime containers shape')
    if tuple(containers.keys()) != CRITICAL_CONTAINER_NAMES:
        raise DockerRuntimeStatusProducerError('unsafe docker runtime allowlist')
    for entry in containers.values():
        if not isinstance(entry, dict) or tuple(entry.keys()) != SAFE_CONTAINER_ENTRY_KEYS:
            raise DockerRuntimeStatusProducerError('unsafe docker runtime entry shape')
        if not isinstance(entry['running'], bool) or entry['health'] not in SAFE_HEALTH_VALUES:
            raise DockerRuntimeStatusProducerError('unsafe docker runtime status values')


def main(argv: Sequence[str] | None = None, *, docker_runner: DockerRunner | None = None) -> int:
    parser = argparse.ArgumentParser(description='Write safe Docker runtime Healthcheck manifest.')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT_PATH, help='Manifest path to write atomically.')
    parser.add_argument('--now', default=None, help='Optional ISO timestamp for deterministic tests.')
    args = parser.parse_args(argv)

    manifest = write_docker_runtime_status(output_path=args.output, now=args.now, docker_runner=docker_runner)
    containers = manifest['containers']  # type: ignore[assignment]
    ok_count = sum(1 for entry in containers.values() if _container_is_ok(entry))  # type: ignore[union-attr]
    total_count = len(containers)  # type: ignore[arg-type]
    print(f"docker runtime manifest written status={manifest['status']} ok={ok_count}/{total_count}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

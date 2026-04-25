#!/usr/bin/env python3
"""Write the safe Hermes gateway Healthcheck manifest.

This producer is intentionally outside the backend Healthcheck module. It may
query user-level systemd for allowlisted Hermes gateway units, but the manifest
it writes contains only timestamp/status and per-gateway active booleans consumed
later by GatewayStatusManifestAdapter.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Sequence

DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/gateway-status.json')
MUGIWARA_GATEWAY_SLUGS: tuple[str, ...] = (
    'luffy',
    'zoro',
    'nami',
    'usopp',
    'sanji',
    'chopper',
    'robin',
    'franky',
    'brook',
    'jinbe',
)
SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'gateways')
SAFE_GATEWAY_ENTRY_KEYS = ('active',)
SystemctlRunner = Callable[[list[str]], subprocess.CompletedProcess[str]]


class GatewayStatusProducerError(RuntimeError):
    """Raised when the producer cannot compute or write a safe manifest."""


def write_gateway_status(
    *,
    output_path: Path = DEFAULT_OUTPUT_PATH,
    now: str | datetime | None = None,
    systemctl_runner: SystemctlRunner | None = None,
) -> dict[str, object]:
    output = output_path.resolve()
    updated_at = _safe_timestamp(now)
    runner = systemctl_runner or _run_systemctl

    gateways: dict[str, dict[str, bool]] = {}
    for slug in MUGIWARA_GATEWAY_SLUGS:
        gateways[slug] = {'active': _gateway_is_active(slug, runner)}

    status = 'success' if all(entry['active'] for entry in gateways.values()) else 'failed'
    manifest: dict[str, object] = {
        'status': status,
        'result': status,
        'updated_at': updated_at,
        'gateways': gateways,
    }
    _write_atomic_json(output, manifest)
    return manifest


def _gateway_is_active(slug: str, runner: SystemctlRunner) -> bool:
    if slug not in MUGIWARA_GATEWAY_SLUGS:
        raise GatewayStatusProducerError('unsupported gateway slug')
    unit_name = f'hermes-gateway-{slug}.service'
    try:
        result = runner(['systemctl', '--user', 'is-active', unit_name])
    except OSError as exc:
        raise GatewayStatusProducerError('systemd gateway state could not be read safely') from exc
    return result.returncode == 0 and result.stdout.strip() == 'active'


def _run_systemctl(command: list[str]) -> subprocess.CompletedProcess[str]:
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
        fd, temp_path = tempfile.mkstemp(prefix='.gateway-status.', suffix='.tmp', dir=output.parent)
        with os.fdopen(fd, 'w', encoding='utf-8') as handle:
            fd = -1
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temp_path, 0o640)
        os.replace(temp_path, output)
        os.chmod(output, 0o640)
    except OSError as exc:
        if fd >= 0:
            os.close(fd)
        if temp_path:
            try:
                os.unlink(temp_path)
            except FileNotFoundError:
                pass
        raise GatewayStatusProducerError('manifest could not be written atomically') from exc


def _validate_manifest_shape(manifest: dict[str, object]) -> None:
    if tuple(manifest.keys()) != SAFE_MANIFEST_KEYS:
        raise GatewayStatusProducerError('unsafe manifest shape')
    gateways = manifest.get('gateways')
    if not isinstance(gateways, dict):
        raise GatewayStatusProducerError('unsafe gateway manifest shape')
    if tuple(gateways.keys()) != MUGIWARA_GATEWAY_SLUGS:
        raise GatewayStatusProducerError('unsafe gateway slug set')
    for entry in gateways.values():
        if not isinstance(entry, dict) or tuple(entry.keys()) != SAFE_GATEWAY_ENTRY_KEYS:
            raise GatewayStatusProducerError('unsafe gateway entry shape')
        if not isinstance(entry['active'], bool):
            raise GatewayStatusProducerError('unsafe gateway active value')


def main(argv: Sequence[str] | None = None, *, systemctl_runner: SystemctlRunner | None = None) -> int:
    parser = argparse.ArgumentParser(description='Write safe Hermes gateway Healthcheck manifest.')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT_PATH, help='Manifest path to write atomically.')
    parser.add_argument('--now', default=None, help='Optional ISO timestamp for deterministic tests.')
    args = parser.parse_args(argv)

    manifest = write_gateway_status(output_path=args.output, now=args.now, systemctl_runner=systemctl_runner)
    active_count = sum(1 for entry in manifest['gateways'].values() if entry['active'])  # type: ignore[index, union-attr]
    total_count = len(manifest['gateways'])  # type: ignore[arg-type]
    print(f"gateway manifest written status={manifest['status']} active={active_count}/{total_count}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

#!/usr/bin/env python3
"""Write the safe cronjobs Healthcheck manifest.

This producer is intentionally outside the backend Healthcheck module. It reads
only allowlisted Hermes profile cron registries and writes a minimal aggregate
manifest consumed later by CronjobsManifestAdapter. It never serializes job names,
prompts, commands, delivery targets, profile names, raw outputs or host paths.
"""
from __future__ import annotations

import argparse
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Mapping, Sequence

DEFAULT_PROFILES_ROOT = Path('/home/agentops/.hermes/profiles')
DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/cronjobs-status.json')
ALLOWED_CRON_PROFILES: tuple[str, ...] = (
    'luffy',
    'franky',
    'usopp',
    'sanji',
)
CRITICAL_JOB_NAMES: frozenset[str] = frozenset(
    {
        'vault-sync',
    }
)
SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'jobs')
SAFE_JOB_ENTRY_KEYS = ('last_run_at', 'last_status', 'criticality')
SUCCESS_STATUSES: frozenset[str] = frozenset({'ok', 'success', 'pass'})
FAILED_STATUSES: frozenset[str] = frozenset({'error', 'failed', 'fail'})
DEGRADED_STATUSES: frozenset[str] = frozenset({'warn', 'warning', 'stale', 'dirty', 'diverged'})


class CronjobsStatusProducerError(RuntimeError):
    """Raised when the producer cannot compute or write a safe manifest."""


def write_cronjobs_status(
    *,
    profiles_root: Path = DEFAULT_PROFILES_ROOT,
    output_path: Path = DEFAULT_OUTPUT_PATH,
    now: str | datetime | None = None,
) -> dict[str, object]:
    root = profiles_root.resolve()
    output = output_path.resolve()
    updated_at = _safe_timestamp(now)

    jobs: list[dict[str, str]] = []
    for profile in ALLOWED_CRON_PROFILES:
        jobs.extend(_safe_jobs_from_profile(root, profile))

    status = _derive_status(jobs)
    manifest: dict[str, object] = {
        'status': status,
        'result': status,
        'updated_at': updated_at,
        'jobs': jobs,
    }
    _write_atomic_json(output, manifest)
    return manifest


def _safe_jobs_from_profile(profiles_root: Path, profile: str) -> list[dict[str, str]]:
    if profile not in ALLOWED_CRON_PROFILES:
        raise CronjobsStatusProducerError('unsupported cron profile')

    registry_path = profiles_root / profile / 'cron' / 'jobs.json'
    if not registry_path.exists():
        return []

    try:
        registry = json.loads(registry_path.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise CronjobsStatusProducerError('cron registry could not be read safely') from exc

    if not isinstance(registry, Mapping):
        raise CronjobsStatusProducerError('unsafe cron registry shape')

    raw_jobs = registry.get('jobs')
    if not isinstance(raw_jobs, list):
        raise CronjobsStatusProducerError('unsafe cron jobs shape')

    safe_jobs: list[dict[str, str]] = []
    for raw_job in raw_jobs:
        if not isinstance(raw_job, Mapping):
            continue
        if raw_job.get('enabled') is not True:
            continue
        if raw_job.get('state') not in {'scheduled', 'running'}:
            continue
        schedule = raw_job.get('schedule')
        if isinstance(schedule, Mapping) and schedule.get('kind') == 'once':
            continue
        safe_entry = _safe_job_entry(raw_job)
        if safe_entry['criticality'] == 'normal' and not safe_entry['last_run_at']:
            continue
        safe_jobs.append(safe_entry)
    return safe_jobs


def _safe_job_entry(raw_job: Mapping[object, object]) -> dict[str, str]:
    job_name = raw_job.get('name')
    criticality = 'critical' if isinstance(job_name, str) and job_name in CRITICAL_JOB_NAMES else 'normal'
    return {
        'last_run_at': _safe_optional_timestamp(raw_job.get('last_run_at')) or '',
        'last_status': _safe_job_status(raw_job.get('last_status')),
        'criticality': criticality,
    }


def _derive_status(jobs: Sequence[Mapping[str, str]]) -> str:
    if not jobs:
        return 'warning'

    critical_jobs = [job for job in jobs if job.get('criticality') == 'critical']
    if any(job.get('last_status') in FAILED_STATUSES for job in critical_jobs):
        return 'failed'
    if any(not job.get('last_run_at') or job.get('last_status') == 'unknown' for job in critical_jobs):
        return 'warning'
    if any(job.get('last_status') in DEGRADED_STATUSES for job in jobs):
        return 'warning'
    if any(job.get('last_status') in FAILED_STATUSES for job in jobs):
        return 'warning'
    return 'success'


def _safe_job_status(value: object) -> str:
    if not isinstance(value, str):
        return 'unknown'
    normalized = value.strip().lower()
    if normalized in SUCCESS_STATUSES:
        return 'success'
    if normalized in FAILED_STATUSES:
        return 'failed'
    if normalized in DEGRADED_STATUSES:
        return 'warning'
    return 'unknown'


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


def _safe_optional_timestamp(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    try:
        return _safe_timestamp(value)
    except ValueError:
        return None


def _write_atomic_json(output: Path, manifest: dict[str, object]) -> None:
    _validate_manifest_shape(manifest)

    output.parent.mkdir(mode=0o750, parents=True, exist_ok=True)
    os.chmod(output.parent, 0o750)

    payload = json.dumps(manifest, ensure_ascii=False, separators=(',', ':'), sort_keys=False) + '\n'
    fd = -1
    temp_path = ''
    try:
        fd, temp_path = tempfile.mkstemp(prefix='.cronjobs-status.', suffix='.tmp', dir=output.parent)
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
        raise CronjobsStatusProducerError('manifest could not be written atomically') from exc


def _validate_manifest_shape(manifest: dict[str, object]) -> None:
    if tuple(manifest.keys()) != SAFE_MANIFEST_KEYS:
        raise CronjobsStatusProducerError('unsafe cronjobs manifest shape')
    jobs = manifest.get('jobs')
    if not isinstance(jobs, list):
        raise CronjobsStatusProducerError('unsafe cronjobs jobs shape')
    for job in jobs:
        if not isinstance(job, dict) or tuple(job.keys()) != SAFE_JOB_ENTRY_KEYS:
            raise CronjobsStatusProducerError('unsafe cronjobs job entry shape')
        if job['criticality'] not in {'critical', 'normal'}:
            raise CronjobsStatusProducerError('unsafe cronjobs criticality')
        if not isinstance(job['last_run_at'], str) or not isinstance(job['last_status'], str):
            raise CronjobsStatusProducerError('unsafe cronjobs status fields')


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description='Write safe cronjobs Healthcheck manifest.')
    parser.add_argument('--profiles-root', type=Path, default=DEFAULT_PROFILES_ROOT, help='Hermes profiles root to inspect.')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT_PATH, help='Manifest path to write atomically.')
    parser.add_argument('--now', default=None, help='Optional ISO timestamp for deterministic tests.')
    args = parser.parse_args(argv)

    manifest = write_cronjobs_status(profiles_root=args.profiles_root, output_path=args.output, now=args.now)
    job_count = len(manifest['jobs'])  # type: ignore[arg-type]
    print(f"cronjobs manifest written status={manifest['status']} jobs={job_count}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

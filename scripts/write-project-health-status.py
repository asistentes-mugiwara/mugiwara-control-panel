#!/usr/bin/env python3
"""Write the safe project-health Healthcheck manifest.

This producer is intentionally outside the backend Healthcheck module. It may query
Git locally, but the manifest it writes contains only boolean/timestamp/status
semantics consumed later by ProjectHealthManifestAdapter.
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

DEFAULT_REPO_PATH = Path('/srv/crew-core/projects/mugiwara-control-panel')
DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/project-health-status.json')
SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'workspace_clean', 'main_branch', 'remote_synced')


class ProjectHealthProducerError(RuntimeError):
    """Raised when the producer cannot compute or write a safe manifest."""


def write_project_health_status(
    *,
    repo_path: Path = DEFAULT_REPO_PATH,
    output_path: Path = DEFAULT_OUTPUT_PATH,
    now: str | datetime | None = None,
) -> dict[str, object]:
    repo = repo_path.resolve()
    output = output_path.resolve()
    updated_at = _safe_timestamp(now)

    workspace_clean = _git_workspace_clean(repo)
    main_branch = _git_on_main(repo)
    remote_synced = _git_remote_synced(repo)
    status = _derive_status(
        workspace_clean=workspace_clean,
        main_branch=main_branch,
        remote_synced=remote_synced,
    )

    manifest: dict[str, object] = {
        'status': status,
        'result': status,
        'updated_at': updated_at,
        'workspace_clean': workspace_clean,
        'main_branch': main_branch,
        'remote_synced': remote_synced,
    }
    _write_atomic_json(output, manifest)
    return manifest


def _derive_status(*, workspace_clean: bool, main_branch: bool, remote_synced: bool) -> str:
    if not workspace_clean:
        return 'dirty'
    if not main_branch:
        return 'warning'
    if not remote_synced:
        return 'diverged'
    return 'success'


def _git_workspace_clean(repo: Path) -> bool:
    result = _run_git(repo, 'status', '--porcelain=v1')
    return result.stdout == ''


def _git_on_main(repo: Path) -> bool:
    result = _run_git(repo, 'branch', '--show-current')
    return result.stdout.strip() == 'main'


def _git_remote_synced(repo: Path) -> bool:
    upstream = _run_git(repo, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}', check=False)
    if upstream.returncode != 0:
        return False

    head = _run_git(repo, 'rev-parse', 'HEAD', check=False)
    remote_head = _run_git(repo, 'rev-parse', '@{u}', check=False)
    if head.returncode != 0 or remote_head.returncode != 0:
        return False
    return head.stdout.strip() == remote_head.stdout.strip()


def _run_git(repo: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    try:
        result = subprocess.run(
            ['git', '-C', str(repo), *args],
            check=False,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except OSError as exc:
        raise ProjectHealthProducerError('git execution failed') from exc

    if check and result.returncode != 0:
        raise ProjectHealthProducerError('git state could not be read safely')
    return result


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
    if tuple(manifest.keys()) != SAFE_MANIFEST_KEYS:
        raise ProjectHealthProducerError('unsafe manifest shape')

    output.parent.mkdir(mode=0o750, parents=True, exist_ok=True)
    os.chmod(output.parent, 0o750)

    payload = json.dumps(manifest, ensure_ascii=False, separators=(',', ':'), sort_keys=False) + '\n'
    fd = -1
    temp_path = ''
    try:
        fd, temp_path = tempfile.mkstemp(prefix='.project-health-status.', suffix='.tmp', dir=output.parent)
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
        raise ProjectHealthProducerError('manifest could not be written atomically') from exc


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description='Write safe project-health Healthcheck manifest.')
    parser.add_argument('--repo', type=Path, default=DEFAULT_REPO_PATH, help='Git repository to inspect.')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT_PATH, help='Manifest path to write atomically.')
    parser.add_argument('--now', default=None, help='Optional ISO timestamp for deterministic tests.')
    args = parser.parse_args(argv)

    manifest = write_project_health_status(repo_path=args.repo, output_path=args.output, now=args.now)
    print(
        'project-health manifest written '
        f"status={manifest['status']} "
        f"workspace_clean={str(manifest['workspace_clean']).lower()} "
        f"main_branch={str(manifest['main_branch']).lower()} "
        f"remote_synced={str(manifest['remote_synced']).lower()}"
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

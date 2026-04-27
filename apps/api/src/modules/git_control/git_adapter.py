from __future__ import annotations

from pathlib import Path
import subprocess

from .domain import (
    FORBIDDEN_GIT_COMMANDS,
    GIT_COMMAND_TIMEOUT_SECONDS,
    GIT_MINIMAL_ENV,
    GIT_SAFE_CONFIG_ARGS,
    GitRepoStatus,
    READ_ONLY_GIT_COMMANDS,
)
from .registry import GitRepoDefinition


class GitStatusAdapter:
    def read_status(self, repo: GitRepoDefinition) -> GitRepoStatus:
        try:
            output = _run_git_status(repo.path)
            return _parse_porcelain_status(output)
        except Exception:
            return GitRepoStatus.unknown()


def _run_git_status(repo_path: Path) -> str:
    return _run_allowlisted_git(
        repo_path,
        [
            'git',
            '--no-optional-locks',
            *GIT_SAFE_CONFIG_ARGS,
            'status',
            '--porcelain=v1',
            '--branch',
            '--untracked-files=all',
            '--no-renames',
        ],
    )


def _run_allowlisted_git(repo_path: Path, args: list[str]) -> str:
    if len(args) < 3 or args[0] != 'git':
        raise ValueError('unsupported git invocation')
    command = _extract_git_command(args)
    if command not in READ_ONLY_GIT_COMMANDS or command in FORBIDDEN_GIT_COMMANDS:
        raise ValueError('unsupported git command')

    completed = subprocess.run(
        args,
        cwd=repo_path,
        timeout=GIT_COMMAND_TIMEOUT_SECONDS,
        env=GIT_MINIMAL_ENV,
        shell=False,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return completed.stdout


def _extract_git_command(args: list[str]) -> str | None:
    index = 1
    while index < len(args):
        value = args[index]
        if value == '-c':
            index += 2
            continue
        if value.startswith('--'):
            index += 1
            continue
        return value
    return None


def _parse_porcelain_status(output: str) -> GitRepoStatus:
    current_branch: str | None = None
    changed_files_count = 0
    untracked_files_count = 0

    for line in output.splitlines():
        if line.startswith('## '):
            current_branch = _sanitize_branch_name(line[3:])
            continue
        if not line:
            continue
        if line.startswith('??'):
            untracked_files_count += 1
        else:
            changed_files_count += 1

    working_tree = 'clean' if changed_files_count == 0 and untracked_files_count == 0 else 'dirty'
    return GitRepoStatus(
        source_state='live',
        working_tree=working_tree,
        changed_files_count=changed_files_count,
        untracked_files_count=untracked_files_count,
        current_branch=current_branch,
    )


def _sanitize_branch_name(raw: str) -> str | None:
    name = raw.split('...', 1)[0].strip()
    if not name or name.startswith('HEAD'):
        return None
    allowed = []
    for char in name:
        if char.isalnum() or char in {'-', '_', '.', '/'}:
            allowed.append(char)
        else:
            return None
    sanitized = ''.join(allowed)
    if len(sanitized) > 80:
        return None
    return sanitized

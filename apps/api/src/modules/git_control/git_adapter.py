from __future__ import annotations

from pathlib import Path
import subprocess

from .domain import (
    FORBIDDEN_GIT_COMMANDS,
    GIT_COMMAND_TIMEOUT_SECONDS,
    GIT_COMMITS_DEFAULT_LIMIT,
    GIT_COMMITS_MAX_LIMIT,
    GIT_CURSOR_PATTERN,
    GIT_MINIMAL_ENV,
    GIT_SAFE_CONFIG_ARGS,
    GIT_SHA_PATTERN,
    GitBranchSummary,
    GitCommitSummary,
    GitRepoStatus,
    READ_ONLY_GIT_COMMANDS,
)
from .registry import GitRepoDefinition


class GitInvalidCursor(ValueError):
    pass


class GitInvalidLimit(ValueError):
    pass


class GitReadAdapter:
    def read_status(self, repo: GitRepoDefinition) -> GitRepoStatus:
        try:
            output = _run_git_status(repo.path)
            return _parse_porcelain_status(output)
        except Exception:
            return GitRepoStatus.unknown()

    def list_commits(
        self,
        repo: GitRepoDefinition,
        *,
        limit: int = GIT_COMMITS_DEFAULT_LIMIT,
        cursor: str | None = None,
    ) -> tuple[list[GitCommitSummary], str | None, str]:
        offset = _parse_cursor(cursor)
        _validate_limit(limit)
        try:
            output = _run_git_log(repo.path, limit=limit + 1, offset=offset)
            commits = _parse_git_log(output)
        except Exception:
            return [], None, 'unknown'
        visible = commits[:limit]
        next_cursor = f'offset:{offset + limit}' if len(commits) > limit else None
        return visible, next_cursor, 'live'

    def list_branches(self, repo: GitRepoDefinition) -> tuple[list[GitBranchSummary], str | None, str]:
        try:
            output = _run_git_branches(repo.path)
            branches = _parse_git_branches(output)
        except Exception:
            return [], None, 'unknown'
        current = next((branch.name for branch in branches if branch.current), None)
        return branches, current, 'live'


class GitStatusAdapter(GitReadAdapter):
    pass


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


def _run_git_log(repo_path: Path, *, limit: int, offset: int) -> str:
    return _run_allowlisted_git(
        repo_path,
        [
            'git',
            '--no-optional-locks',
            *GIT_SAFE_CONFIG_ARGS,
            'log',
            f'--max-count={limit}',
            f'--skip={offset}',
            '--format=%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%cI%x1f%s%x1f%B%x1e',
        ],
    )


def _run_git_branches(repo_path: Path) -> str:
    return _run_allowlisted_git(
        repo_path,
        [
            'git',
            '--no-optional-locks',
            *GIT_SAFE_CONFIG_ARGS,
            'branch',
            '--format=%(refname:short)%00%(HEAD)%00%(objectname)',
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


def _validate_limit(limit: int) -> None:
    if limit < 1 or limit > GIT_COMMITS_MAX_LIMIT:
        raise GitInvalidLimit('invalid commit limit')


def _parse_cursor(cursor: str | None) -> int:
    if cursor is None:
        return 0
    match = GIT_CURSOR_PATTERN.fullmatch(cursor)
    if not match:
        raise GitInvalidCursor('invalid commit cursor')
    return int(match.group(1))


def _parse_git_log(output: str) -> list[GitCommitSummary]:
    commits: list[GitCommitSummary] = []
    for record in output.split('\x1e'):
        record = record.strip('\n')
        if not record:
            continue
        parts = record.split('\x1f', 7)
        if len(parts) != 8:
            continue
        sha, short_sha, author_name, author_email, authored_at, committed_at, subject, body = parts
        if not GIT_SHA_PATTERN.fullmatch(sha):
            continue
        trailers = _extract_trailers(body)
        commits.append(
            GitCommitSummary(
                sha=sha,
                short_sha=_sanitize_short_sha(short_sha, sha),
                author_name=_sanitize_text(author_name, max_length=120),
                author_email=_sanitize_email(author_email),
                authored_at=_sanitize_text(authored_at, max_length=40),
                committed_at=_sanitize_text(committed_at, max_length=40),
                subject=_sanitize_text(subject, max_length=200),
                mugiwara_agent=trailers.get('mugiwara-agent'),
                signed_off_by=trailers.get('signed-off-by'),
            )
        )
    return commits


def _parse_git_branches(output: str) -> list[GitBranchSummary]:
    branches: list[GitBranchSummary] = []
    for line in output.splitlines():
        parts = line.split('\x00')
        if len(parts) != 3:
            continue
        raw_name, marker, sha = parts
        name = _sanitize_branch_name(raw_name)
        if name is None or not GIT_SHA_PATTERN.fullmatch(sha):
            continue
        branches.append(
            GitBranchSummary(
                name=name,
                current=marker == '*',
                sha=sha,
                short_sha=sha[:12],
            )
        )
    return branches


def _extract_trailers(body: str) -> dict[str, str | None]:
    trailers: dict[str, str | None] = {'mugiwara-agent': None, 'signed-off-by': None}
    for line in body.splitlines():
        if ':' not in line:
            continue
        key, value = line.split(':', 1)
        normalized = key.strip().lower()
        if normalized in trailers:
            trailers[normalized] = _sanitize_text(value.strip(), max_length=160)
    return trailers


def _sanitize_text(value: str, *, max_length: int) -> str:
    safe = ''.join(char for char in value if char.isprintable() and char not in {'\x1e', '\x1f', '\x00'})
    return safe[:max_length]


def _sanitize_email(value: str) -> str:
    safe = _sanitize_text(value, max_length=160)
    if '@' not in safe or any(marker in safe.lower() for marker in ('token', 'secret', 'password', '/')):
        return ''
    return safe


def _sanitize_short_sha(value: str, sha: str) -> str:
    return sha[:12]

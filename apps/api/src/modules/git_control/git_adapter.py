from __future__ import annotations

from pathlib import Path
import re
import subprocess

from .domain import (
    FORBIDDEN_GIT_COMMANDS,
    GIT_COMMAND_TIMEOUT_SECONDS,
    GIT_COMMITS_DEFAULT_LIMIT,
    GIT_COMMITS_MAX_LIMIT,
    GIT_CURSOR_PATTERN,
    GIT_DIFF_MAX_FILES,
    GIT_DIFF_MAX_LINE_LENGTH,
    GIT_DIFF_MAX_LINES_PER_FILE,
    GIT_DIFF_MAX_TOTAL_LINES,
    GIT_MINIMAL_ENV,
    GIT_SAFE_CONFIG_ARGS,
    GIT_SHA_PATTERN,
    GitBranchSummary,
    GitCommitDiffFile,
    GitCommitFileSummary,
    GitCommitSummary,
    GitRepoStatus,
    READ_ONLY_GIT_COMMANDS,
)
from .registry import GitRepoDefinition


class GitInvalidCursor(ValueError):
    pass


class GitInvalidLimit(ValueError):
    pass


class GitInvalidSha(ValueError):
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

    def get_commit_detail(self, repo: GitRepoDefinition, *, sha: str) -> tuple[GitCommitSummary | None, list[GitCommitFileSummary], str]:
        _validate_sha(sha)
        try:
            commit_output = _run_git_commit_detail(repo.path, sha=sha)
            stats_output = _run_git_commit_numstat(repo.path, sha=sha)
            commits = _parse_git_log(commit_output)
            if not commits:
                return None, [], 'unknown'
            return commits[0], _parse_numstat(stats_output), 'live'
        except Exception:
            return None, [], 'unknown'

    def get_commit_diff(self, repo: GitRepoDefinition, *, sha: str) -> tuple[list[GitCommitDiffFile], bool, bool, int, str]:
        _validate_sha(sha)
        try:
            stats_output = _run_git_commit_numstat(repo.path, sha=sha)
            patch_output = _run_git_commit_patch(repo.path, sha=sha)
            summaries = _parse_numstat(stats_output)
            files, truncated, redacted, omitted_count = _build_safe_diff(summaries, patch_output)
            return files, truncated, redacted, omitted_count, 'live'
        except Exception:
            return [], False, False, 0, 'unknown'


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


def _run_git_commit_detail(repo_path: Path, *, sha: str) -> str:
    return _run_allowlisted_git(
        repo_path,
        [
            'git',
            '--no-optional-locks',
            *GIT_SAFE_CONFIG_ARGS,
            'show',
            '--no-ext-diff',
            '--no-renames',
            '-s',
            '--format=%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%cI%x1f%s%x1f%B%x1e',
            sha,
            '--',
        ],
    )


def _run_git_commit_numstat(repo_path: Path, *, sha: str) -> str:
    return _run_allowlisted_git(
        repo_path,
        [
            'git',
            '--no-optional-locks',
            *GIT_SAFE_CONFIG_ARGS,
            'show',
            '--no-ext-diff',
            '--no-renames',
            '--format=',
            '--numstat',
            '--diff-filter=ACDMRT',
            sha,
            '--',
        ],
    )


def _run_git_commit_patch(repo_path: Path, *, sha: str) -> str:
    return _run_allowlisted_git(
        repo_path,
        [
            'git',
            '--no-optional-locks',
            *GIT_SAFE_CONFIG_ARGS,
            'show',
            '--no-ext-diff',
            '--no-renames',
            '--format=',
            '--patch',
            '--unified=3',
            '--diff-filter=ACDMRT',
            sha,
            '--',
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


def _validate_sha(sha: str) -> None:
    if not GIT_SHA_PATTERN.fullmatch(sha):
        raise GitInvalidSha('invalid commit identifier')


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


def _parse_numstat(output: str) -> list[GitCommitFileSummary]:
    files: list[GitCommitFileSummary] = []
    for line in output.splitlines():
        if not line.strip():
            continue
        if '\x1f' in line:
            parts = line.split('\x1f')
            if len(parts) != 4:
                continue
            raw_path, additions_raw, deletions_raw, change_type_raw = parts
        else:
            parts = line.split('\t')
            if len(parts) < 3:
                continue
            additions_raw, deletions_raw, raw_path = parts[0], parts[1], parts[2]
            change_type_raw = 'modified'
        binary = additions_raw == '-' or deletions_raw == '-'
        additions = None if binary else _parse_int(additions_raw)
        deletions = None if binary else _parse_int(deletions_raw)
        safe_path = _sanitize_repo_path(raw_path)
        sensitive = _is_sensitive_path(raw_path)
        omitted = sensitive or binary
        omitted_reason = 'sensitive_path' if sensitive else ('binary' if binary else None)
        files.append(
            GitCommitFileSummary(
                path=None if omitted else safe_path,
                change_type=_sanitize_change_type(change_type_raw, additions, deletions),
                additions=additions,
                deletions=deletions,
                binary=binary,
                omitted=omitted,
                omitted_reason=omitted_reason,
            )
        )
        if len(files) >= GIT_DIFF_MAX_FILES:
            break
    return files


def _parse_int(value: str) -> int | None:
    try:
        return int(value)
    except ValueError:
        return None


def _sanitize_change_type(raw: str, additions: int | None, deletions: int | None) -> str:
    value = raw.lower()
    allowed = {'added', 'modified', 'deleted', 'renamed', 'copied', 'typechange'}
    if value in allowed and value != 'modified':
        return value
    if deletions == 0 and additions and additions > 0:
        return 'added'
    if additions == 0 and deletions and deletions > 0:
        return 'deleted'
    return 'modified'


def _build_safe_diff(summaries: list[GitCommitFileSummary], patch_output: str) -> tuple[list[GitCommitDiffFile], bool, bool, int]:
    patch_by_path = _split_patch_by_path(patch_output)
    files: list[GitCommitDiffFile] = []
    total_lines = 0
    any_truncated = False
    any_redacted = False
    omitted_count = 0
    for summary in summaries:
        if summary.omitted or summary.path is None:
            omitted_count += 1
            files.append(GitCommitDiffFile(summary=summary, truncated=False, redacted=False, lines=()))
            continue
        raw_lines = patch_by_path.get(summary.path, [])
        safe_lines: list[dict[str, str]] = []
        file_truncated = False
        file_redacted = False
        for raw_line in raw_lines:
            if total_lines >= GIT_DIFF_MAX_TOTAL_LINES or len(safe_lines) >= GIT_DIFF_MAX_LINES_PER_FILE:
                file_truncated = True
                break
            safe_line, redacted = _sanitize_diff_line(raw_line)
            if redacted:
                file_redacted = True
            safe_lines.append({'kind': _classify_diff_line(raw_line), 'content': safe_line})
            total_lines += 1
        if len(raw_lines) > len(safe_lines):
            file_truncated = True
        any_truncated = any_truncated or file_truncated
        any_redacted = any_redacted or file_redacted
        files.append(
            GitCommitDiffFile(
                summary=summary,
                truncated=file_truncated,
                redacted=file_redacted,
                lines=tuple(safe_lines),
            )
        )
    return files, any_truncated, any_redacted, omitted_count


def _split_patch_by_path(output: str) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    current_path: str | None = None
    current_lines: list[str] = []
    for line in output.splitlines():
        if line.startswith('diff --git '):
            if current_path is not None:
                result[current_path] = current_lines
            current_path = _path_from_diff_header(line)
            current_lines = []
            continue
        if current_path is None:
            continue
        if line.startswith(('index ', 'new file mode ', 'deleted file mode ', 'similarity index ', 'rename from ', 'rename to ')):
            continue
        if line.startswith('--- ') or line.startswith('+++ '):
            continue
        current_lines.append(line)
    if current_path is not None:
        result[current_path] = current_lines
    return result


def _path_from_diff_header(line: str) -> str | None:
    parts = line.split(' ')
    if len(parts) < 4:
        return None
    raw = parts[3]
    if raw.startswith('b/'):
        raw = raw[2:]
    return _sanitize_repo_path(raw)


def _sanitize_repo_path(raw: str | None) -> str | None:
    if raw is None:
        return None
    value = raw.strip().strip('"')
    if value.startswith(('a/', 'b/')):
        value = value[2:]
    if not value or value.startswith('/') or '..' in value.split('/'):
        return None
    if len(value) > 180:
        return None
    allowed = []
    for char in value:
        if char.isalnum() or char in {'-', '_', '.', '/', '@'}:
            allowed.append(char)
        else:
            return None
    return ''.join(allowed)


SENSITIVE_PATH_RE = re.compile(
    r'(^|/)(\.env($|\.)|.*(secret|token|password|credential|cookie|private).*|.*\.(key|pem|p12|pfx|sqlite|sqlite3|db|log|dump|bak|backup)$)',
    re.IGNORECASE,
)
SECRET_CONTENT_RE = re.compile(
    r'(authorization:|bearer\s+|token\s*=|secret\s*=|password\s*=|cookie\s*=|-----begin .*private key-----|ghp_[a-z0-9_]+|sk-[a-z0-9_-]+|xox[a-z]-)',
    re.IGNORECASE,
)
HOST_PATH_RE = re.compile(r'/(srv|home|tmp|var|etc)/[^\s]+', re.IGNORECASE)


def _is_sensitive_path(raw_path: str | None) -> bool:
    sanitized = _sanitize_repo_path(raw_path)
    if sanitized is None:
        return True
    return SENSITIVE_PATH_RE.search(sanitized) is not None


def _sanitize_diff_line(value: str) -> tuple[str, bool]:
    safe = _sanitize_text(value, max_length=GIT_DIFF_MAX_LINE_LENGTH)
    redacted = False
    if SECRET_CONTENT_RE.search(safe) or HOST_PATH_RE.search(safe):
        prefix = safe[:1] if safe[:1] in {'+', '-', ' '} else ''
        safe = f'{prefix}[redacted]'
        redacted = True
    return safe, redacted


def _classify_diff_line(value: str) -> str:
    if value.startswith('@@'):
        return 'hunk'
    if value.startswith('+'):
        return 'addition'
    if value.startswith('-'):
        return 'deletion'
    return 'context'


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

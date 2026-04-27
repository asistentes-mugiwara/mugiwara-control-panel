from __future__ import annotations

from dataclasses import dataclass
import re


GIT_CONTROL_SOURCE_LABEL = 'backend-owned-git-registry'
GIT_COMMAND_TIMEOUT_SECONDS = 2.0
GIT_COMMITS_DEFAULT_LIMIT = 25
GIT_COMMITS_MAX_LIMIT = 50
GIT_DIFF_MAX_FILES = 25
GIT_DIFF_MAX_LINES_PER_FILE = 120
GIT_DIFF_MAX_TOTAL_LINES = 400
GIT_DIFF_MAX_LINE_LENGTH = 240
GIT_CURSOR_PATTERN = re.compile(r'^offset:(0|[1-9][0-9]{0,5})$')
GIT_SHA_PATTERN = re.compile(r'^[0-9a-f]{40}$|^[0-9a-f]{64}$')
GIT_MINIMAL_ENV = {
    'PATH': '/usr/bin:/bin',
    'LANG': 'C',
    'LC_ALL': 'C',
    'GIT_CONFIG_GLOBAL': '/dev/null',
    'GIT_CONFIG_SYSTEM': '/dev/null',
    'GIT_CONFIG_NOSYSTEM': '1',
}
GIT_SAFE_CONFIG_ARGS = (
    '-c',
    'core.fsmonitor=false',
    '-c',
    'core.hooksPath=/dev/null',
)
READ_ONLY_GIT_COMMANDS = frozenset({'status', 'log', 'branch', 'show'})
FORBIDDEN_GIT_COMMANDS = frozenset(
    {
        'checkout',
        'reset',
        'commit',
        'push',
        'pull',
        'fetch',
        'stash',
        'merge',
        'rebase',
        'tag',
    }
)


@dataclass(frozen=True)
class GitRepoStatus:
    source_state: str
    working_tree: str
    changed_files_count: int | None
    untracked_files_count: int | None
    current_branch: str | None

    @classmethod
    def unknown(cls) -> 'GitRepoStatus':
        return cls(
            source_state='unknown',
            working_tree='unknown',
            changed_files_count=None,
            untracked_files_count=None,
            current_branch=None,
        )

    def to_public(self) -> dict:
        return {
            'source_state': self.source_state,
            'working_tree': self.working_tree,
            'changed_files_count': self.changed_files_count,
            'untracked_files_count': self.untracked_files_count,
            'current_branch': self.current_branch,
        }


@dataclass(frozen=True)
class GitCommitSummary:
    sha: str
    short_sha: str
    author_name: str
    author_email: str
    authored_at: str
    committed_at: str
    subject: str
    mugiwara_agent: str | None
    signed_off_by: str | None

    def to_public(self) -> dict:
        return {
            'sha': self.sha,
            'short_sha': self.short_sha,
            'author_name': self.author_name,
            'author_email': self.author_email,
            'authored_at': self.authored_at,
            'committed_at': self.committed_at,
            'subject': self.subject,
            'trailers': {
                'mugiwara_agent': self.mugiwara_agent,
                'signed_off_by': self.signed_off_by,
            },
        }


@dataclass(frozen=True)
class GitBranchSummary:
    name: str
    current: bool
    sha: str
    short_sha: str

    def to_public(self) -> dict:
        return {
            'name': self.name,
            'current': self.current,
            'sha': self.sha,
            'short_sha': self.short_sha,
        }


@dataclass(frozen=True)
class GitCommitFileSummary:
    path: str | None
    change_type: str
    additions: int | None
    deletions: int | None
    binary: bool
    omitted: bool
    omitted_reason: str | None

    def to_public(self) -> dict:
        return {
            'path': self.path,
            'change_type': self.change_type,
            'additions': self.additions,
            'deletions': self.deletions,
            'binary': self.binary,
            'omitted': self.omitted,
            'omitted_reason': self.omitted_reason,
        }


@dataclass(frozen=True)
class GitCommitDiffFile:
    summary: GitCommitFileSummary
    truncated: bool
    redacted: bool
    lines: tuple[dict[str, str], ...]

    def to_public(self) -> dict:
        payload = self.summary.to_public()
        payload.update(
            {
                'truncated': self.truncated,
                'redacted': self.redacted,
                'lines': list(self.lines),
            }
        )
        return payload

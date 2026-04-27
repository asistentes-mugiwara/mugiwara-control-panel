from __future__ import annotations

from dataclasses import dataclass


GIT_CONTROL_SOURCE_LABEL = 'backend-owned-git-registry'
GIT_COMMAND_TIMEOUT_SECONDS = 2.0
GIT_MINIMAL_ENV = {
    'PATH': '/usr/bin:/bin',
    'LANG': 'C',
    'LC_ALL': 'C',
    'GIT_CONFIG_NOSYSTEM': '1',
}
READ_ONLY_GIT_COMMANDS = frozenset({'status'})
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

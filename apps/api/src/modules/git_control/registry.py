from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re


_REPO_ID_PATTERN = re.compile(r'^[a-z0-9][a-z0-9._-]{0,63}$')


@dataclass(frozen=True)
class GitRepoDefinition:
    repo_id: str
    label: str
    scope: str
    path: Path | str

    def __post_init__(self) -> None:
        if not _is_safe_repo_id(self.repo_id):
            raise ValueError('invalid git repo id')
        object.__setattr__(self, 'path', Path(self.path))


class GitRepoRegistry:
    def __init__(self, repos: tuple[GitRepoDefinition, ...]) -> None:
        repo_by_id: dict[str, GitRepoDefinition] = {}
        for repo in repos:
            if repo.repo_id in repo_by_id:
                raise ValueError('duplicate git repo id')
            repo_by_id[repo.repo_id] = repo
        self._repos = tuple(repos)
        self._repo_by_id = repo_by_id

    def list_repos(self) -> tuple[GitRepoDefinition, ...]:
        return self._repos

    def get(self, repo_id: str) -> GitRepoDefinition | None:
        if not _is_safe_repo_id(repo_id):
            return None
        return self._repo_by_id.get(repo_id)


def _is_safe_repo_id(value: str) -> bool:
    return bool(_REPO_ID_PATTERN.fullmatch(value))


def default_git_repo_registry() -> GitRepoRegistry:
    return GitRepoRegistry(
        repos=(
            GitRepoDefinition(
                repo_id='mugiwara-control-panel',
                label='Mugiwara Control Panel',
                scope='project',
                path=Path('/srv/crew-core/projects/mugiwara-control-panel'),
            ),
            GitRepoDefinition(
                repo_id='crew-core',
                label='Crew Core',
                scope='operations',
                path=Path('/srv/crew-core'),
            ),
            GitRepoDefinition(
                repo_id='vault',
                label='Mugiwara Vault',
                scope='canon',
                path=Path('/srv/crew-core/vault'),
            ),
        )
    )

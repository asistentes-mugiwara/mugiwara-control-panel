from __future__ import annotations

from .domain import GitRepoStatus
from .git_adapter import GitStatusAdapter
from .registry import GitRepoDefinition, GitRepoRegistry, default_git_repo_registry


class GitRepoNotFound(Exception):
    pass


class GitControlService:
    def __init__(
        self,
        *,
        registry: GitRepoRegistry | None = None,
        status_adapter: GitStatusAdapter | None = None,
    ) -> None:
        self._registry = registry or default_git_repo_registry()
        self._status_adapter = status_adapter or GitStatusAdapter()

    def list_repos(self) -> dict:
        repos = []
        for repo in self._registry.list_repos():
            repos.append(_repo_index_entry(repo, self._status_adapter.read_status(repo)))
        return {'repos': repos}

    def get_repo_status(self, repo_id: str) -> dict:
        repo = self._registry.get(repo_id)
        if repo is None:
            raise GitRepoNotFound()
        status = self._status_adapter.read_status(repo)
        return {'repo_id': repo.repo_id, 'status': status.to_public()}

    @staticmethod
    def status_for_index(index: dict) -> str:
        repos = index.get('repos') or []
        if any((repo.get('status') or {}).get('source_state') != 'live' for repo in repos):
            return 'source_unavailable'
        return 'ready'

    @staticmethod
    def status_for_repo_status(status_payload: dict) -> str:
        status = status_payload.get('status') or {}
        if status.get('source_state') == 'live':
            return 'ready'
        return 'source_unavailable'


def _repo_index_entry(repo: GitRepoDefinition, status: GitRepoStatus) -> dict:
    return {
        'repo_id': repo.repo_id,
        'label': repo.label,
        'scope': repo.scope,
        'status': status.to_public(),
    }

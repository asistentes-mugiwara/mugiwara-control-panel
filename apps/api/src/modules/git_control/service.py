from __future__ import annotations

from .domain import GIT_COMMITS_DEFAULT_LIMIT, GitRepoStatus
from .git_adapter import GitInvalidCursor, GitInvalidLimit, GitInvalidSha, GitReadAdapter
from .registry import GitRepoDefinition, GitRepoRegistry, default_git_repo_registry


class GitRepoNotFound(Exception):
    pass


class GitControlService:
    def __init__(
        self,
        *,
        registry: GitRepoRegistry | None = None,
        status_adapter: GitReadAdapter | None = None,
    ) -> None:
        self._registry = registry or default_git_repo_registry()
        self._read_adapter = status_adapter or GitReadAdapter()

    def list_repos(self) -> dict:
        repos = []
        for repo in self._registry.list_repos():
            repos.append(_repo_index_entry(repo, self._read_adapter.read_status(repo)))
        return {'repos': repos}

    def get_repo_status(self, repo_id: str) -> dict:
        repo = self._registry.get(repo_id)
        if repo is None:
            raise GitRepoNotFound()
        status = self._read_adapter.read_status(repo)
        return {'repo_id': repo.repo_id, 'status': status.to_public()}

    def list_commits(self, repo_id: str, *, limit: int = GIT_COMMITS_DEFAULT_LIMIT, cursor: str | None = None) -> dict:
        repo = self._registry.get(repo_id)
        if repo is None:
            raise GitRepoNotFound()
        commits, next_cursor, source_state = self._read_adapter.list_commits(repo, limit=limit, cursor=cursor)
        return {
            'repo_id': repo.repo_id,
            'commits': [commit.to_public() for commit in commits],
            'limit': limit,
            'next_cursor': next_cursor,
            'source_state': source_state,
        }


    def get_commit_detail(self, repo_id: str, *, sha: str) -> dict:
        repo = self._registry.get(repo_id)
        if repo is None:
            raise GitRepoNotFound()
        commit, files, source_state = self._read_adapter.get_commit_detail(repo, sha=sha)
        return {
            'repo_id': repo.repo_id,
            'commit': commit.to_public() if commit is not None else None,
            'files': [file.to_public() for file in files],
            'source_state': source_state,
        }

    def get_commit_diff(self, repo_id: str, *, sha: str) -> dict:
        repo = self._registry.get(repo_id)
        if repo is None:
            raise GitRepoNotFound()
        files, truncated, redacted, omitted_files_count, source_state = self._read_adapter.get_commit_diff(repo, sha=sha)
        return {
            'repo_id': repo.repo_id,
            'sha': sha,
            'files': [file.to_public() for file in files],
            'truncated': truncated,
            'redacted': redacted,
            'omitted_files_count': omitted_files_count,
            'source_state': source_state,
        }

    def list_branches(self, repo_id: str) -> dict:
        repo = self._registry.get(repo_id)
        if repo is None:
            raise GitRepoNotFound()
        branches, current_branch, source_state = self._read_adapter.list_branches(repo)
        return {
            'repo_id': repo.repo_id,
            'current_branch': current_branch,
            'branches': [branch.to_public() for branch in branches],
            'source_state': source_state,
        }

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

    @staticmethod
    def status_for_commit_list(commits_payload: dict) -> str:
        if commits_payload.get('source_state') == 'live':
            return 'ready'
        return 'source_unavailable'

    @staticmethod
    def status_for_branch_list(branches_payload: dict) -> str:
        if branches_payload.get('source_state') == 'live':
            return 'ready'
        return 'source_unavailable'

    @staticmethod
    def status_for_commit_detail(detail_payload: dict) -> str:
        if detail_payload.get('source_state') == 'live' and detail_payload.get('commit') is not None:
            return 'ready'
        return 'source_unavailable'

    @staticmethod
    def status_for_commit_diff(diff_payload: dict) -> str:
        if diff_payload.get('source_state') == 'live':
            return 'ready'
        return 'source_unavailable'


def _repo_index_entry(repo: GitRepoDefinition, status: GitRepoStatus) -> dict:
    return {
        'repo_id': repo.repo_id,
        'label': repo.label,
        'scope': repo.scope,
        'status': status.to_public(),
    }

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from ...shared.contracts import resource_response
from .domain import GIT_COMMITS_DEFAULT_LIMIT, GIT_CONTROL_SOURCE_LABEL
from .git_adapter import GitInvalidCursor, GitInvalidLimit
from .service import GitControlService, GitRepoNotFound

router = APIRouter(prefix='/api/v1/git', tags=['git_control'])
_service = GitControlService()


def get_git_control_service() -> GitControlService:
    return _service


@router.get('/repos')
def list_git_repos(service: GitControlService = Depends(get_git_control_service)) -> dict:
    repo_index = service.list_repos()
    return resource_response(
        resource='git.repo_index',
        status=service.status_for_index(repo_index),
        data=repo_index,
        meta={
            'read_only': True,
            'sanitized': True,
            'source': GIT_CONTROL_SOURCE_LABEL,
        },
    )


@router.get('/repos/{repo_id}/status')
def get_git_repo_status(repo_id: str, service: GitControlService = Depends(get_git_control_service)) -> dict:
    try:
        status_payload = service.get_repo_status(repo_id)
    except GitRepoNotFound:
        return _git_repo_not_found_response()
    return resource_response(
        resource='git.repo_status',
        status=service.status_for_repo_status(status_payload),
        data=status_payload,
        meta=_git_meta(),
    )


@router.get('/repos/{repo_id}/commits')
def list_git_repo_commits(
    repo_id: str,
    limit: int = GIT_COMMITS_DEFAULT_LIMIT,
    cursor: str | None = None,
    service: GitControlService = Depends(get_git_control_service),
):
    try:
        commits_payload = service.list_commits(repo_id, limit=limit, cursor=cursor)
    except GitRepoNotFound:
        return _git_repo_not_found_response()
    except GitInvalidLimit:
        return _git_validation_error_response('git_invalid_limit', 'Invalid commit limit.')
    except GitInvalidCursor:
        return _git_validation_error_response('git_invalid_cursor', 'Invalid commit cursor.')
    return resource_response(
        resource='git.commit_list',
        status=service.status_for_commit_list(commits_payload),
        data=commits_payload,
        meta=_git_meta(),
    )


@router.get('/repos/{repo_id}/branches')
def list_git_repo_branches(repo_id: str, service: GitControlService = Depends(get_git_control_service)):
    try:
        branches_payload = service.list_branches(repo_id)
    except GitRepoNotFound:
        return _git_repo_not_found_response()
    return resource_response(
        resource='git.branch_list',
        status=service.status_for_branch_list(branches_payload),
        data=branches_payload,
        meta=_git_meta(),
    )


def _git_meta() -> dict:
    return {
        'read_only': True,
        'sanitized': True,
        'source': GIT_CONTROL_SOURCE_LABEL,
    }


def _git_repo_not_found_response() -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={
            'detail': {
                'code': 'git_repo_not_found',
                'message': 'Git repository is not configured.',
            }
        },
    )


def _git_validation_error_response(code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={
            'detail': {
                'code': code,
                'message': message,
            }
        },
    )

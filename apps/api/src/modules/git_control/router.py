from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from ...shared.contracts import resource_response
from .domain import GIT_CONTROL_SOURCE_LABEL
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
        return JSONResponse(
            status_code=404,
            content={
                'detail': {
                    'code': 'git_repo_not_found',
                    'message': 'Git repository is not configured.',
                }
            },
        )
    return resource_response(
        resource='git.repo_status',
        status=service.status_for_repo_status(status_payload),
        data=status_payload,
        meta={
            'read_only': True,
            'sanitized': True,
            'source': GIT_CONTROL_SOURCE_LABEL,
        },
    )

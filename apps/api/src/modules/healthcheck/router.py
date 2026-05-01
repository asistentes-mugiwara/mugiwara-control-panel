from __future__ import annotations

from fastapi import APIRouter, Depends

from ...shared.contracts import resource_response
from .service import HealthcheckService

router = APIRouter(prefix='/api/v1/healthcheck', tags=['healthcheck'])


def get_healthcheck_service() -> HealthcheckService:
    # Build a fresh service per request so fixed manifests are re-read live and
    # the API cannot keep stale snapshots from router import time.
    return HealthcheckService()


@router.get('')
def get_healthcheck_workspace(service: HealthcheckService = Depends(get_healthcheck_service)) -> dict:
    workspace = service.get_workspace()
    return resource_response(
        resource='healthcheck.workspace',
        status=service.workspace_status(),
        data=workspace,
        meta={
            'count': len(workspace['modules']),
            'read_only': True,
            'sanitized': True,
            'source': 'backend-owned-safe-catalog',
        },
    )

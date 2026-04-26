from __future__ import annotations

from fastapi import APIRouter, Depends

from ...shared.contracts import resource_response
from .service import USAGE_REFRESH_INTERVAL_MINUTES, UsageService

router = APIRouter(prefix='/api/v1/usage', tags=['usage'])
_service = UsageService()


def get_usage_service() -> UsageService:
    return _service


@router.get('/current')
def get_usage_current(service: UsageService = Depends(get_usage_service)) -> dict:
    current_usage = service.get_current()
    return resource_response(
        resource='usage.current',
        status=service.status_for(current_usage),
        data=current_usage,
        meta={
            'read_only': True,
            'sanitized': True,
            'source': 'codex-usage-snapshot-sqlite',
            'refresh_interval_minutes': USAGE_REFRESH_INTERVAL_MINUTES,
        },
    )

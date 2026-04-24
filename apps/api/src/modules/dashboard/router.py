from __future__ import annotations

from fastapi import APIRouter, Depends

from ...shared.contracts import resource_response
from .service import DashboardService

router = APIRouter(prefix='/api/v1/dashboard', tags=['dashboard'])
_service = DashboardService()


def get_dashboard_service() -> DashboardService:
    return _service


@router.get('')
def get_dashboard_summary(service: DashboardService = Depends(get_dashboard_service)) -> dict:
    summary = service.get_summary()
    return resource_response(
        resource='dashboard.summary',
        status=service.summary_status(),
        data=summary,
        meta={
            'links_count': len(summary['links']),
            'read_only': True,
            'sanitized': True,
            'source': 'backend-owned-aggregation',
        },
    )

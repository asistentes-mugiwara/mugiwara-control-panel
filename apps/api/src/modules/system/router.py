from __future__ import annotations

from fastapi import APIRouter, Depends

from ...shared.contracts import resource_response
from .service import SYSTEM_METRICS_DISK_TARGET_LABEL, SYSTEM_METRICS_SOURCE_LABEL, SystemMetricsService

router = APIRouter(prefix='/api/v1/system', tags=['system'])
_service = SystemMetricsService()


def get_system_metrics_service() -> SystemMetricsService:
    return _service


@router.get('/metrics')
def get_system_metrics(service: SystemMetricsService = Depends(get_system_metrics_service)) -> dict:
    metrics = service.get_metrics()
    return resource_response(
        resource='system.metrics',
        status=service.status_for(metrics),
        data=metrics,
        meta={
            'read_only': True,
            'sanitized': True,
            'source': SYSTEM_METRICS_SOURCE_LABEL,
            'disk_target': SYSTEM_METRICS_DISK_TARGET_LABEL,
        },
    )

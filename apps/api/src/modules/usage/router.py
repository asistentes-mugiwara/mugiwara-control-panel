from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from ...shared.contracts import resource_response
from .service import DEFAULT_USAGE_WINDOWS_LIMIT, MAX_USAGE_WINDOWS_LIMIT, USAGE_REFRESH_INTERVAL_MINUTES, UsageCalendarRange, UsageService

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


@router.get('/calendar')
def get_usage_calendar(range: UsageCalendarRange = 'current_cycle', service: UsageService = Depends(get_usage_service)) -> dict:
    calendar = service.get_calendar(range)
    return resource_response(
        resource='usage.calendar',
        status=service.calendar_status_for(calendar),
        data=calendar,
        meta={
            'read_only': True,
            'sanitized': True,
            'source': 'codex-usage-snapshot-sqlite',
            'range': range,
            'timezone': 'Europe/Madrid',
        },
    )


@router.get('/five-hour-windows')
def get_usage_five_hour_windows(
    limit: int = Query(DEFAULT_USAGE_WINDOWS_LIMIT, ge=1, le=MAX_USAGE_WINDOWS_LIMIT),
    service: UsageService = Depends(get_usage_service),
) -> dict:
    windows = service.get_five_hour_windows(limit)
    return resource_response(
        resource='usage.five_hour_windows',
        status=service.five_hour_windows_status_for(windows),
        data=windows,
        meta={
            'read_only': True,
            'sanitized': True,
            'source': 'codex-usage-snapshot-sqlite',
            'limit': limit,
        },
    )

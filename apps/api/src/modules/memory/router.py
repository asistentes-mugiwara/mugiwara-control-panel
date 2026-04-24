from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, Depends

from ...shared.contracts import resource_response
from .service import MemoryService

router = APIRouter(prefix='/api/v1/memory', tags=['memory'])
_service = MemoryService()


def get_memory_service() -> MemoryService:
    return _service


@router.get('')
def list_memory(service: MemoryService = Depends(get_memory_service)) -> dict:
    items = service.list_summary()
    return resource_response(
        resource='memory.summary',
        status=service.catalog_status(),
        data={'items': items},
        meta={'count': len(items), 'sources': ['built-in', 'honcho'], 'read_only': True, 'sanitized': True},
    )


@router.get('/{slug}')
def get_memory_detail(slug: str, service: MemoryService = Depends(get_memory_service)) -> dict:
    detail = service.get_detail(slug)
    return resource_response(
        resource='memory.agent_detail',
        status='ready',
        data=asdict(detail),
        meta={'mugiwara_slug': slug, 'read_only': True, 'sanitized': True},
    )

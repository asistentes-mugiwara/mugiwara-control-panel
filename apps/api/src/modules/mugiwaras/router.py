from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, Depends

from ...shared.contracts import resource_response
from .service import CANONICAL_CREW_RULES_DISPLAY_PATH, MugiwaraService

router = APIRouter(prefix='/api/v1/mugiwaras', tags=['mugiwaras'])
_service = MugiwaraService()


def get_mugiwaras_service() -> MugiwaraService:
    return _service


@router.get('')
def list_mugiwaras(service: MugiwaraService = Depends(get_mugiwaras_service)) -> dict:
    catalog = service.list_catalog()
    items = catalog['items']
    return resource_response(
        resource='mugiwaras.catalog',
        status='ready',
        data=catalog,
        meta={
            'count': len(items),
            'crew_rules_document': CANONICAL_CREW_RULES_DISPLAY_PATH,
            'read_only': True,
        },
    )


@router.get('/{slug}/soul')
def get_mugiwara_soul_document(slug: str, service: MugiwaraService = Depends(get_mugiwaras_service)) -> dict:
    document = service.get_soul_document(slug)
    return resource_response(
        resource='mugiwaras.soul_document',
        status='ready',
        data=asdict(document),
        meta={'slug': slug, 'read_only': True},
    )


@router.get('/{slug}')
def get_mugiwara_profile(slug: str, service: MugiwaraService = Depends(get_mugiwaras_service)) -> dict:
    profile = service.get_profile(slug)
    return resource_response(
        resource='mugiwaras.profile',
        status='ready',
        data=asdict(profile),
        meta={'slug': slug, 'read_only': True},
    )

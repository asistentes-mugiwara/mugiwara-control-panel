from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, Depends

from ...shared.contracts import resource_response
from .service import VaultService

router = APIRouter(prefix='/api/v1/vault', tags=['vault'])
_service = VaultService()


def get_vault_service() -> VaultService:
    return _service


@router.get('')
def get_vault_index(service: VaultService = Depends(get_vault_service)) -> dict:
    workspace = service.list_index()
    return resource_response(
        resource='vault.workspace',
        status='ready',
        data=workspace,
        meta={'safe_root': 'canonical_vault', 'read_only': True, 'allowlisted': True},
    )


@router.get('/documents/{document_path:path}')
def get_vault_document(document_path: str, service: VaultService = Depends(get_vault_service)) -> dict:
    document = service.get_document_by_path(document_path)
    return resource_response(
        resource='vault.document',
        status='ready',
        data=asdict(document),
        meta={'path': document.meta.path, 'markdown_only': True, 'read_only': True, 'allowlisted': True},
    )

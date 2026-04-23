from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ...shared.contracts import resource_response
from .service import SkillService

router = APIRouter(prefix='/api/v1/skills', tags=['skills'])
_service = SkillService()


class SkillPreviewRequest(BaseModel):
    content: str = Field(min_length=1)
    expected_sha256: str = Field(min_length=64, max_length=64)


class SkillUpdateRequest(SkillPreviewRequest):
    actor: str = Field(min_length=1, max_length=120)


def get_skill_service() -> SkillService:
    return _service


@router.get('')
def list_skills(service: SkillService = Depends(get_skill_service)) -> dict:
    items = [asdict(item) for item in service.list_catalog()]
    return resource_response(
        resource='skills.catalog',
        status='ready',
        data={'items': items},
        meta={'count': len(items), 'editable_count': sum(1 for item in items if item['editable'])},
    )


@router.get('/audit')
def get_skills_audit(service: SkillService = Depends(get_skill_service)) -> dict:
    records = service.recent_audit()
    return resource_response(
        resource='skills.audit',
        status='ready',
        data={'items': records},
        meta={'count': len(records)},
    )


@router.get('/{skill_id}')
def get_skill_detail(skill_id: str, service: SkillService = Depends(get_skill_service)) -> dict:
    detail = service.get_detail(skill_id)
    return resource_response(
        resource='skills.detail',
        status='ready',
        data=asdict(detail),
        meta={'editable': detail.editable, 'skill_id': detail.skill_id},
    )


@router.post('/{skill_id}/preview')
def preview_skill_update(skill_id: str, payload: SkillPreviewRequest, service: SkillService = Depends(get_skill_service)) -> dict:
    preview = service.preview_update(skill_id=skill_id, candidate_content=payload.content, expected_sha256=payload.expected_sha256)
    return resource_response(
        resource='skills.preview',
        status='ready',
        data=preview,
        meta={'skill_id': skill_id},
    )


@router.put('/{skill_id}')
def update_skill(skill_id: str, payload: SkillUpdateRequest, service: SkillService = Depends(get_skill_service)) -> dict:
    detail, audit = service.update_skill(
        skill_id=skill_id,
        actor=payload.actor,
        candidate_content=payload.content,
        expected_sha256=payload.expected_sha256,
    )
    return resource_response(
        resource='skills.update',
        status='ready',
        data={'skill': asdict(detail), 'audit': asdict(audit)},
        meta={'skill_id': skill_id, 'actor': payload.actor},
    )

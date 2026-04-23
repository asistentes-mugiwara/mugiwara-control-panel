from __future__ import annotations

import hashlib
import json
from dataclasses import asdict
from datetime import datetime, timezone
from difflib import unified_diff
from pathlib import Path
from typing import Iterable

from fastapi import HTTPException, status

from .domain import (
    SkillAuditRecord,
    SkillCatalogItem,
    SkillDetail,
    SkillDiffSummary,
    SkillFingerprint,
    SkillRegistryEntry,
)

MAX_SKILL_BYTES = 200_000
DEFAULT_ALLOWED_ROOT = Path('/srv/crew-core/skills-source').resolve()
DEFAULT_AUDIT_PATH = Path('/srv/crew-core/projects/mugiwara-control-panel/runtime/skills-audit.jsonl')

DEFAULT_SKILL_ALLOWLIST: tuple[SkillRegistryEntry, ...] = (
    SkillRegistryEntry(
        skill_id='zoro-opencode-operator',
        display_name='OpenCode operator',
        owner_scope='agent',
        public_repo_risk='medium',
        repo_path='/srv/crew-core/skills-source/agents/zoro/zoro-opencode-operator/SKILL.md',
        path=Path('/srv/crew-core/skills-source/agents/zoro/zoro-opencode-operator/SKILL.md'),
        editable=True,
    ),
    SkillRegistryEntry(
        skill_id='mugiwara-git-identity',
        display_name='Git identity governance',
        owner_scope='shared',
        public_repo_risk='high',
        repo_path='/srv/crew-core/skills-source/global/mugiwara-git-identity/SKILL.md',
        path=Path('/srv/crew-core/skills-source/global/mugiwara-git-identity/SKILL.md'),
        editable=True,
    ),
    SkillRegistryEntry(
        skill_id='judgment-day',
        display_name='Judgment Day',
        owner_scope='runtime',
        public_repo_risk='high',
        repo_path='~/.config/opencode/skills/judgment-day/SKILL.md',
        path=Path('~/.config/opencode/skills/judgment-day/SKILL.md').expanduser(),
        editable=False,
    ),
)


class SkillService:
    def __init__(
        self,
        *,
        registry: Iterable[SkillRegistryEntry] | None = None,
        allowed_root: Path = DEFAULT_ALLOWED_ROOT,
        audit_log_path: Path = DEFAULT_AUDIT_PATH,
    ) -> None:
        self._registry = {entry.skill_id: entry for entry in (registry or DEFAULT_SKILL_ALLOWLIST)}
        self._allowed_root = allowed_root.resolve()
        self._audit_log_path = audit_log_path

    def list_catalog(self) -> list[SkillCatalogItem]:
        return [
            SkillCatalogItem(
                skill_id=entry.skill_id,
                display_name=entry.display_name,
                owner_scope=entry.owner_scope,
                public_repo_risk=entry.public_repo_risk,
                editable=entry.editable,
                repo_path=entry.repo_path,
            )
            for entry in self._registry.values()
        ]

    def get_detail(self, skill_id: str) -> SkillDetail:
        entry = self._get_entry(skill_id)
        content = self._read_text(entry)
        fingerprint = self._fingerprint(content)
        return SkillDetail(
            skill_id=entry.skill_id,
            display_name=entry.display_name,
            owner_scope=entry.owner_scope,
            public_repo_risk=entry.public_repo_risk,
            editable=entry.editable,
            repo_path=entry.repo_path,
            content=content,
            fingerprint=fingerprint,
        )

    def preview_update(self, *, skill_id: str, candidate_content: str, expected_sha256: str) -> dict:
        entry = self._get_entry(skill_id)
        if not entry.editable:
            raise self._reject(status.HTTP_403_FORBIDDEN, 'forbidden', 'Skill fuera de allowlist editable.')
        current_content = self._read_text(entry)
        current_fingerprint = self._fingerprint(current_content)
        self._ensure_expected_fingerprint(expected_sha256, current_fingerprint.sha256)
        self._validate_candidate(candidate_content)
        next_fingerprint = self._fingerprint(candidate_content)
        diff_summary = self._diff_summary(current_content, candidate_content)
        return {
            'skill_id': entry.skill_id,
            'repo_path': entry.repo_path,
            'before': asdict(current_fingerprint),
            'after': asdict(next_fingerprint),
            'diff_summary': asdict(diff_summary),
        }

    def update_skill(self, *, skill_id: str, actor: str, candidate_content: str, expected_sha256: str) -> tuple[SkillDetail, SkillAuditRecord]:
        entry = self._get_entry(skill_id)
        if not entry.editable:
            record = self._build_audit_record(
                actor=actor,
                entry=entry,
                before_sha256='',
                after_sha256='',
                diff_summary=SkillDiffSummary(lines_added=0, lines_removed=0, hunks=0, preview=[], truncated=False),
                result='rejected',
                reason='Skill fuera de allowlist editable.',
            )
            self._append_audit(record)
            raise self._reject(status.HTTP_403_FORBIDDEN, 'forbidden', 'Skill fuera de allowlist editable.')

        current_content = self._read_text(entry)
        current_fingerprint = self._fingerprint(current_content)

        try:
            self._ensure_expected_fingerprint(expected_sha256, current_fingerprint.sha256)
            self._validate_candidate(candidate_content)
        except HTTPException as exc:
            record = self._build_audit_record(
                actor=actor,
                entry=entry,
                before_sha256=current_fingerprint.sha256,
                after_sha256=current_fingerprint.sha256,
                diff_summary=SkillDiffSummary(lines_added=0, lines_removed=0, hunks=0, preview=[], truncated=False),
                result='rejected',
                reason=str(exc.detail.get('message')) if isinstance(exc.detail, dict) else str(exc.detail),
            )
            self._append_audit(record)
            raise

        diff_summary = self._diff_summary(current_content, candidate_content)
        entry.path.write_text(candidate_content, encoding='utf-8')
        next_fingerprint = self._fingerprint(candidate_content)
        detail = SkillDetail(
            skill_id=entry.skill_id,
            display_name=entry.display_name,
            owner_scope=entry.owner_scope,
            public_repo_risk=entry.public_repo_risk,
            editable=entry.editable,
            repo_path=entry.repo_path,
            content=candidate_content,
            fingerprint=next_fingerprint,
        )
        record = self._build_audit_record(
            actor=actor,
            entry=entry,
            before_sha256=current_fingerprint.sha256,
            after_sha256=next_fingerprint.sha256,
            diff_summary=diff_summary,
            result='success',
            reason=None,
        )
        self._append_audit(record)
        return detail, record

    def recent_audit(self, limit: int = 20) -> list[dict]:
        if not self._audit_log_path.exists():
            return []
        lines = self._audit_log_path.read_text(encoding='utf-8').splitlines()[-limit:]
        return [json.loads(line) for line in reversed(lines) if line.strip()]

    def _get_entry(self, skill_id: str) -> SkillRegistryEntry:
        entry = self._registry.get(skill_id)
        if entry is None:
            raise self._reject(status.HTTP_404_NOT_FOUND, 'not_found', 'Skill no configurada en allowlist.')
        self._validate_entry_path(entry)
        if not entry.path.exists():
            raise self._reject(status.HTTP_503_SERVICE_UNAVAILABLE, 'source_unavailable', 'La ruta allowlisted no está disponible.')
        return entry

    def _validate_entry_path(self, entry: SkillRegistryEntry) -> None:
        resolved = entry.path.expanduser().resolve()
        if resolved.is_symlink():
            raise self._reject(status.HTTP_503_SERVICE_UNAVAILABLE, 'source_unavailable', 'Symlink no permitido en la allowlist.')
        if entry.editable and self._allowed_root not in resolved.parents:
            raise self._reject(status.HTTP_503_SERVICE_UNAVAILABLE, 'not_configured', 'La skill editable sale del árbol permitido.')
        if resolved.name != 'SKILL.md':
            raise self._reject(status.HTTP_503_SERVICE_UNAVAILABLE, 'not_configured', 'La allowlist solo puede apuntar a SKILL.md.')

    def _read_text(self, entry: SkillRegistryEntry) -> str:
        content = entry.path.read_text(encoding='utf-8')
        if len(content.encode('utf-8')) > MAX_SKILL_BYTES:
            raise self._reject(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, 'validation_error', 'El SKILL.md supera el tamaño máximo permitido.')
        return content

    def _validate_candidate(self, content: str) -> None:
        encoded = content.encode('utf-8')
        if len(encoded) > MAX_SKILL_BYTES:
            raise self._reject(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, 'validation_error', 'El payload supera el tamaño máximo permitido.')
        if '\x00' in content:
            raise self._reject(status.HTTP_422_UNPROCESSABLE_ENTITY, 'validation_error', 'El payload contiene bytes nulos no permitidos.')
        stripped = content.strip()
        if not stripped:
            raise self._reject(status.HTTP_422_UNPROCESSABLE_ENTITY, 'validation_error', 'El contenido no puede quedar vacío.')
        if 'name:' not in content or 'description:' not in content:
            raise self._reject(status.HTTP_422_UNPROCESSABLE_ENTITY, 'validation_error', 'El SKILL.md debe conservar al menos name y description.')

    def _ensure_expected_fingerprint(self, expected_sha256: str, current_sha256: str) -> None:
        if expected_sha256 != current_sha256:
            raise self._reject(status.HTTP_409_CONFLICT, 'stale', 'Fingerprint desactualizado; recarga la skill antes de guardar.')

    def _fingerprint(self, content: str) -> SkillFingerprint:
        payload = content.encode('utf-8')
        return SkillFingerprint(sha256=hashlib.sha256(payload).hexdigest(), bytes=len(payload))

    def _diff_summary(self, before: str, after: str) -> SkillDiffSummary:
        diff_lines = list(
            unified_diff(
                before.splitlines(),
                after.splitlines(),
                fromfile='before',
                tofile='after',
                lineterm='',
            )
        )
        preview = []
        lines_added = 0
        lines_removed = 0
        hunks = 0
        for line in diff_lines:
            if line.startswith('@@'):
                hunks += 1
            elif line.startswith('+') and not line.startswith('+++'):
                lines_added += 1
            elif line.startswith('-') and not line.startswith('---'):
                lines_removed += 1
            if len(preview) < 20:
                preview.append(line)
        return SkillDiffSummary(
            lines_added=lines_added,
            lines_removed=lines_removed,
            hunks=hunks,
            preview=preview,
            truncated=len(diff_lines) > len(preview),
        )

    def _build_audit_record(
        self,
        *,
        actor: str,
        entry: SkillRegistryEntry,
        before_sha256: str,
        after_sha256: str,
        diff_summary: SkillDiffSummary,
        result: str,
        reason: str | None,
    ) -> SkillAuditRecord:
        return SkillAuditRecord(
            timestamp=datetime.now(timezone.utc).isoformat(),
            actor=actor,
            skill_id=entry.skill_id,
            repo_path=entry.repo_path,
            before_sha256=before_sha256,
            after_sha256=after_sha256,
            diff_summary=diff_summary,
            result=result,
            reason=reason,
        )

    def _append_audit(self, record: SkillAuditRecord) -> None:
        self._audit_log_path.parent.mkdir(parents=True, exist_ok=True)
        with self._audit_log_path.open('a', encoding='utf-8') as fh:
            fh.write(json.dumps(asdict(record), ensure_ascii=False) + '\n')

    def _reject(self, http_status: int, code: str, message: str) -> HTTPException:
        return HTTPException(status_code=http_status, detail={'code': code, 'message': message})

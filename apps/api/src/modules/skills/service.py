from __future__ import annotations

import hashlib
import json
import re
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
SKILL_ID_PATTERN = re.compile(r'^[a-z0-9][a-z0-9_-]{0,139}$')

MUGIWARA_LABELS: dict[str, str] = {
    'luffy': 'Luffy',
    'zoro': 'Zoro',
    'franky': 'Franky',
    'chopper': 'Chopper',
    'usopp': 'Usopp',
    'nami': 'Nami',
    'robin': 'Robin',
    'brook': 'Brook',
    'jinbe': 'Jinbe',
    'sanji': 'Sanji',
}

DEFAULT_RUNTIME_SKILLS: tuple[SkillRegistryEntry, ...] = (
    SkillRegistryEntry(
        skill_id='runtime-judgment-day',
        display_name='Judgment Day',
        owner_scope='runtime',
        owner_slug='runtime',
        owner_label='Runtime OpenCode',
        public_repo_risk='high',
        repo_path='~/.config/opencode/skills/judgment-day/SKILL.md',
        path=Path('~/.config/opencode/skills/judgment-day/SKILL.md').expanduser(),
        editable=False,
    ),
)


def _read_skill_frontmatter(path: Path) -> dict[str, str]:
    try:
        content = path.read_text(encoding='utf-8', errors='replace')
    except OSError:
        return {}

    lines = content.splitlines()
    if not lines or lines[0].strip() != '---':
        return {}

    metadata: dict[str, str] = {}
    for line in lines[1:80]:
        if line.strip() == '---':
            break
        if ':' not in line:
            continue
        key, value = line.split(':', 1)
        key = key.strip().lower()
        value = value.strip().strip('"\'')
        if key in {'name', 'description'} and value:
            metadata[key] = value
    return metadata


def _normalize_skill_slug(value: str) -> str:
    normalized = re.sub(r'[^a-z0-9_-]+', '-', value.lower()).strip('-_')
    normalized = re.sub(r'-{2,}', '-', normalized)
    return normalized[:80] or 'skill'


def _display_name_from_path(path: Path) -> str:
    metadata = _read_skill_frontmatter(path)
    return metadata.get('name') or path.parent.name.replace('-', ' ').replace('_', ' ').title()


def _public_repo_risk_for_skill(path: Path, *, owner_scope: str) -> str:
    text = f'{path.parent.name} {path}'.lower()
    if any(token in text for token in ('auth', 'secret', 'security', 'backup', 'github', 'legal', 'mcp', 'ops', 'runtime')):
        return 'high'
    if owner_scope in {'shared', 'runtime'}:
        return 'medium'
    return 'low'


def build_default_skill_registry(allowed_root: Path = DEFAULT_ALLOWED_ROOT) -> tuple[SkillRegistryEntry, ...]:
    root = allowed_root.resolve()
    entries: list[SkillRegistryEntry] = []

    global_root = root / 'global'
    for path in sorted(global_root.glob('*/SKILL.md')):
        slug = _normalize_skill_slug(path.parent.name)
        entries.append(
            SkillRegistryEntry(
                skill_id=f'global-{slug}',
                display_name=_display_name_from_path(path),
                owner_scope='shared',
                owner_slug='global',
                owner_label='Skills globales',
                public_repo_risk=_public_repo_risk_for_skill(path, owner_scope='shared'),
                repo_path=str(path),
                path=path,
                editable=True,
            )
        )

    agents_root = root / 'agents'
    agent_dirs = sorted((p for p in agents_root.iterdir() if p.is_dir()), key=lambda item: item.name) if agents_root.exists() else []
    for agent_dir in agent_dirs:
        owner_slug = _normalize_skill_slug(agent_dir.name)
        if owner_slug not in MUGIWARA_LABELS:
            continue
        for path in sorted(agent_dir.glob('*/SKILL.md')):
            skill_slug = _normalize_skill_slug(path.parent.name)
            entries.append(
                SkillRegistryEntry(
                    skill_id=f'agent-{owner_slug}-{skill_slug}',
                    display_name=_display_name_from_path(path),
                    owner_scope='agent',
                    owner_slug=owner_slug,
                    owner_label=MUGIWARA_LABELS[owner_slug],
                    public_repo_risk=_public_repo_risk_for_skill(path, owner_scope='agent'),
                    repo_path=str(path),
                    path=path,
                    editable=True,
                )
            )

    entries.extend(DEFAULT_RUNTIME_SKILLS)
    return tuple(entries)


class SkillService:
    def __init__(
        self,
        *,
        registry: Iterable[SkillRegistryEntry] | None = None,
        allowed_root: Path = DEFAULT_ALLOWED_ROOT,
        audit_log_path: Path = DEFAULT_AUDIT_PATH,
    ) -> None:
        self._allowed_root = allowed_root.resolve()
        self._registry = {entry.skill_id: entry for entry in (registry or build_default_skill_registry(self._allowed_root))}
        self._audit_log_path = audit_log_path

    def list_catalog(self) -> list[SkillCatalogItem]:
        return [
            SkillCatalogItem(
                skill_id=entry.skill_id,
                display_name=entry.display_name,
                owner_scope=entry.owner_scope,
                owner_slug=entry.owner_slug,
                owner_label=entry.owner_label,
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
            owner_slug=entry.owner_slug,
            owner_label=entry.owner_label,
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
            owner_slug=entry.owner_slug,
            owner_label=entry.owner_label,
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
        if not SKILL_ID_PATTERN.fullmatch(skill_id):
            raise self._reject(status.HTTP_404_NOT_FOUND, 'not_found', 'Skill no configurada en allowlist.')
        entry = self._registry.get(skill_id)
        if entry is None:
            raise self._reject(status.HTTP_404_NOT_FOUND, 'not_found', 'Skill no configurada en allowlist.')
        self._validate_entry_path(entry)
        if not entry.path.exists():
            raise self._reject(status.HTTP_503_SERVICE_UNAVAILABLE, 'source_unavailable', 'La ruta allowlisted no está disponible.')
        return entry

    def _validate_entry_path(self, entry: SkillRegistryEntry) -> None:
        expanded = entry.path.expanduser()
        if expanded.is_symlink():
            raise self._reject(status.HTTP_503_SERVICE_UNAVAILABLE, 'source_unavailable', 'Symlink no permitido en la allowlist.')
        resolved = expanded.resolve()
        for parent in expanded.parents:
            if parent == parent.parent:
                continue
            if parent.is_symlink():
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

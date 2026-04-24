from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, status

from .domain import (
    VaultBreadcrumb,
    VaultCategory,
    VaultDocument,
    VaultDocumentEntry,
    VaultDocumentMeta,
    VaultDocumentSection,
    VaultFreshness,
    VaultTreeEntry,
)

VAULT_ROOT = Path('/srv/crew-core/vault').resolve()

PROJECT_SUMMARY = VaultDocumentEntry(
    document_id='mugiwara-control-panel-summary',
    label='Mugiwara Control Panel',
    relative_path='03-Projects/Project Summary - Mugiwara Control Panel.md',
    category_id='project-summaries',
    category_label='Project Summaries',
    summary='Resumen canónico del estado funcional del control panel.',
    context='Resumen editorial para retomar el proyecto sin arrastrar trazas efímeras de implementación.',
)
MEMORY_GOVERNANCE = VaultDocumentEntry(
    document_id='memory-governance',
    label='Memory governance',
    relative_path='00-System/Policy - Memory governance.md',
    category_id='system-policies',
    category_label='System Policies',
    summary='Política canónica de capas de memoria Mugiwara.',
    context='Referencia para distinguir builtin memory, Honcho, Engram y vault.',
)
PR_GOVERNANCE = VaultDocumentEntry(
    document_id='pr-governance',
    label='PR governance',
    relative_path='06-Playbooks/Playbook - PR governance Zoro Franky Chopper Usopp.md',
    category_id='ops-playbooks',
    category_label='Ops Playbooks',
    summary='Playbook de revisión PR entre Zoro, Franky, Chopper y Usopp.',
    context='Runbook operativo curado para revisión y merge de PRs software.',
)

SAFE_VAULT_CATEGORIES: tuple[VaultCategory, ...] = (
    VaultCategory('project-summaries', 'Project Summaries', 'projects/summaries', 'Resúmenes canónicos de proyectos software y operativos.', (PROJECT_SUMMARY,)),
    VaultCategory('system-policies', 'System Policies', 'system/policies', 'Políticas canónicas del sistema Mugiwara.', (MEMORY_GOVERNANCE,)),
    VaultCategory('ops-playbooks', 'Ops Playbooks', 'ops/playbooks', 'Runbooks curados para operación y respuesta.', (PR_GOVERNANCE,)),
)


class VaultService:
    def __init__(self, *, root: Path = VAULT_ROOT, categories: tuple[VaultCategory, ...] = SAFE_VAULT_CATEGORIES) -> None:
        self._root = root.resolve()
        self._categories = categories
        self._documents = {document.document_id: document for category in categories for document in category.documents}
        self._paths = {document.relative_path: document for document in self._documents.values()}

    def list_index(self) -> dict:
        tree = self._build_tree()
        documents = [asdict(self.get_document_by_id(document_id)) for document_id in self._documents]
        return {
            'freshness': asdict(self._freshness()),
            'tree': tree,
            'active_document_id': PROJECT_SUMMARY.document_id,
            'documents': documents,
        }

    def get_document_by_id(self, document_id: str) -> VaultDocument:
        document = self._documents.get(document_id)
        if document is None:
            raise self._reject(status.HTTP_404_NOT_FOUND, 'not_found', 'Documento no disponible en la allowlist del vault.')
        return self._read_document(document)

    def get_document_by_path(self, requested_path: str) -> VaultDocument:
        safe_path = self._normalize_requested_path(requested_path)
        document = self._paths.get(safe_path)
        if document is None:
            raise self._reject(status.HTTP_404_NOT_FOUND, 'not_found', 'Documento no disponible en la allowlist del vault.')
        return self._read_document(document)

    def _build_tree(self) -> list[dict]:
        entries: list[VaultTreeEntry] = []
        for category in self._categories:
            entries.append(VaultTreeEntry(
                id=category.category_id,
                label=category.label,
                path_segment=category.path_segment,
                kind='directory',
                summary=category.summary,
                depth=0,
                path=f'/vault/{category.path_segment}',
            ))
            for document in category.documents:
                entries.append(VaultTreeEntry(
                    id=document.document_id,
                    label=document.label,
                    path_segment=Path(document.relative_path).stem,
                    kind='document',
                    summary=document.summary,
                    depth=1,
                    path=f'/vault/{category.path_segment}/{document.document_id}',
                ))
        return [asdict(entry) for entry in entries]

    def _read_document(self, entry: VaultDocumentEntry) -> VaultDocument:
        file_path = self._resolve_allowlisted_path(entry.relative_path)
        text = file_path.read_text(encoding='utf-8')
        title, sections = self._parse_markdown(text)
        toc = [section.heading for section in sections]
        updated_at = datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc).isoformat()
        return VaultDocument(
            id=entry.document_id,
            title=title or entry.label,
            summary=entry.summary,
            canon_callout='Vault es canon curado: lectura documental, sin memoria viva ni acceso arbitrario al filesystem.',
            breadcrumbs=[
                VaultBreadcrumb('Vault', '/vault'),
                VaultBreadcrumb(entry.category_label, f'/vault#{entry.category_id}'),
                VaultBreadcrumb(entry.label, f'/vault#{entry.document_id}'),
            ],
            meta=VaultDocumentMeta(
                path=entry.relative_path,
                updated_at=updated_at,
                toc=toc[:8],
                context=entry.context,
            ),
            sections=sections[:8],
        )

    def _parse_markdown(self, text: str) -> tuple[str, list[VaultDocumentSection]]:
        title = ''
        sections: list[VaultDocumentSection] = []
        current_heading = 'Resumen'
        current_body: list[str] = []
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith('# '):
                if not title:
                    title = line.removeprefix('# ').strip()
                continue
            if line.startswith('## '):
                if current_body:
                    sections.append(VaultDocumentSection(current_heading, current_body[:6]))
                current_heading = line.removeprefix('## ').strip()
                current_body = []
                continue
            if line.startswith('#'):
                continue
            if line.startswith('---') or line.startswith('```'):
                continue
            if self._line_may_expose_host_detail(line):
                continue
            if len(current_body) < 6:
                current_body.append(line[:500])

        if current_body:
            sections.append(VaultDocumentSection(current_heading, current_body[:6]))
        if not sections:
            sections.append(VaultDocumentSection('Resumen', ['Documento canónico disponible en el vault allowlisted.']))
        return title, sections

    def _line_may_expose_host_detail(self, line: str) -> bool:
        sensitive_markers = ('/srv/', '/home/', '.env', 'token', 'secret', 'password')
        lowered = line.lower()
        return any(marker in lowered for marker in sensitive_markers)

    def _normalize_requested_path(self, requested_path: str) -> str:
        if requested_path.startswith('/') or requested_path.startswith('~'):
            raise self._reject(status.HTTP_400_BAD_REQUEST, 'validation_error', 'Ruta de vault no permitida.')
        path = Path(requested_path)
        if path.suffix != '.md':
            raise self._reject(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, 'unsupported_media_type', 'Solo se permiten documentos Markdown allowlisted.')
        if any(part in {'..', ''} for part in path.parts):
            raise self._reject(status.HTTP_400_BAD_REQUEST, 'validation_error', 'Ruta de vault no permitida.')
        return path.as_posix()

    def _resolve_allowlisted_path(self, relative_path: str) -> Path:
        safe_path = self._normalize_requested_path(relative_path)
        candidate = (self._root / safe_path).resolve()
        if self._root not in candidate.parents:
            raise self._reject(status.HTTP_400_BAD_REQUEST, 'validation_error', 'Ruta de vault no permitida.')
        if candidate.is_symlink():
            raise self._reject(status.HTTP_503_SERVICE_UNAVAILABLE, 'source_unavailable', 'Documento de vault no disponible.')
        if not candidate.exists() or not candidate.is_file():
            raise self._reject(status.HTTP_404_NOT_FOUND, 'not_found', 'Documento no disponible en la allowlist del vault.')
        return candidate

    def _freshness(self) -> VaultFreshness:
        mtimes = []
        for document in self._documents.values():
            path = self._resolve_allowlisted_path(document.relative_path)
            mtimes.append(path.stat().st_mtime)
        updated = datetime.fromtimestamp(max(mtimes), tz=timezone.utc).isoformat() if mtimes else datetime.now(timezone.utc).isoformat()
        return VaultFreshness(updated_at=updated, label='Índice backend allowlisted', state='fresh' if mtimes else 'stale')

    def _reject(self, http_status: int, code: str, message: str) -> HTTPException:
        return HTTPException(status_code=http_status, detail={'code': code, 'message': message})

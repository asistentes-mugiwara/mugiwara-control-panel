from __future__ import annotations

from dataclasses import asdict
from pathlib import Path

from fastapi import HTTPException, status

from .domain import CrewRulesDocument, MugiwaraCard, MugiwaraIdentity, MugiwaraProfile, SafeLink

MAX_CREW_RULES_BYTES = 200_000
DEFAULT_CREW_RULES_PATH = Path('/srv/crew-core/AGENTS.md')
CANONICAL_CREW_RULES_DISPLAY_PATH = '/srv/crew-core/AGENTS.md'

CREW_CARDS: tuple[MugiwaraCard, ...] = (
    MugiwaraCard('luffy', 'Luffy', 'operativo', ['delegation-contract', 'crew-orchestration'], 'Capitán operativo', [SafeLink('Ver Memory', '/memory'), SafeLink('Ver Skills', '/skills')]),
    MugiwaraCard('zoro', 'Zoro', 'operativo', ['sdd-orchestrator-zoro', 'zoro-pr-review-handoff'], 'Continuidad fuerte', [SafeLink('Ver Memory', '/memory'), SafeLink('Ver Skills', '/skills')]),
    MugiwaraCard('franky', 'Franky', 'operativo', ['franky-pr-ops-review', 'vault-sync-ops'], 'Runtime vigilado', [SafeLink('Ver Memory', '/memory'), SafeLink('Ver Skills', '/skills')]),
    MugiwaraCard('chopper', 'Chopper', 'operativo', ['chopper-pr-security-review', 'security-hardening'], 'Riesgo controlado', [SafeLink('Ver Memory', '/memory'), SafeLink('Ver Skills', '/skills')]),
    MugiwaraCard('usopp', 'Usopp', 'revision', ['usopp-pr-design-review', 'frontend-spec-usopp'], 'Diseño activo', [SafeLink('Ver Memory', '/memory'), SafeLink('Ver Skills', '/skills')]),
    MugiwaraCard('nami', 'Nami', 'operativo', ['finance-ops', 'google-sheets-control'], 'Señales estables', [SafeLink('Ver Memory', '/memory'), SafeLink('Ver Skills', '/skills')]),
    MugiwaraCard('robin', 'Robin', 'operativo', ['research-synthesis', 'vault-canon'], 'Canon consultable', [SafeLink('Ver Memory', '/memory'), SafeLink('Ver Skills', '/skills')]),
    MugiwaraCard('brook', 'Brook', 'revision', ['data-analysis', 'analytics-standby'], 'Datos en standby', [SafeLink('Ver Memory', '/memory'), SafeLink('Ver Skills', '/skills')]),
    MugiwaraCard('jinbe', 'Jinbe', 'sin-datos', ['legal-context'], 'Definido en canon', [SafeLink('Ver Memory', '/memory'), SafeLink('Ver Skills', '/skills')]),
    MugiwaraCard('sanji', 'Sanji', 'sin-datos', ['physical-ops'], 'Definido en canon', [SafeLink('Ver Memory', '/memory'), SafeLink('Ver Skills', '/skills')]),
)

PROFILE_META: dict[str, dict[str, str]] = {
    'luffy': {'role': 'CEO y orquestador principal', 'accent_color': '#dc2626'},
    'zoro': {'role': 'CTO e ingeniero de software', 'accent_color': '#16a34a'},
    'franky': {'role': 'DevOps e ingeniero de sistemas', 'accent_color': '#0284c7'},
    'chopper': {'role': 'CISO y experto en ciberseguridad', 'accent_color': '#db2777'},
    'usopp': {'role': 'CMO y director de marketing/diseño', 'accent_color': '#ca8a04'},
    'nami': {'role': 'CFO y directora financiera', 'accent_color': '#f97316'},
    'robin': {'role': 'Directora de research e inteligencia', 'accent_color': '#7c3aed'},
    'brook': {'role': 'CDO y data scientist', 'accent_color': '#64748b'},
    'jinbe': {'role': 'CLO y asesor legal', 'accent_color': '#2563eb'},
    'sanji': {'role': 'COO físico y concierge personal', 'accent_color': '#eab308'},
}


class MugiwaraService:
    def __init__(self, *, crew_rules_path: Path = DEFAULT_CREW_RULES_PATH) -> None:
        self._crew_rules_path = crew_rules_path
        self._cards = {card.slug: card for card in CREW_CARDS}

    def list_catalog(self) -> dict:
        document = self.get_crew_rules_document()
        return {
            'items': [asdict(card) for card in self._cards.values()],
            'crew_rules_document': asdict(document),
        }

    def get_profile(self, slug: str) -> MugiwaraProfile:
        card = self._cards.get(slug)
        if card is None:
            raise self._reject(status.HTTP_404_NOT_FOUND, 'not_found', 'Mugiwara no configurado en catálogo read-only.')

        meta = PROFILE_META.get(slug, {'role': 'Mugiwara', 'accent_color': '#94a3b8'})
        return MugiwaraProfile(
            slug=card.slug,
            identity=MugiwaraIdentity(
                name=card.name,
                role=meta['role'],
                crest_src=f'/assets/mugiwaras/crests/{card.slug}.svg',
                accent_color=meta['accent_color'],
            ),
            status=card.status,
            allowed_metadata={
                'read_only': True,
                'source': 'backend_static_allowlist',
                'skills_count': len(card.skills),
            },
            linked_skills=card.skills,
            memory_summary=card.memory_badge,
        )

    def get_crew_rules_document(self) -> CrewRulesDocument:
        content = self._read_canonical_crew_rules()
        return CrewRulesDocument(
            document_id='crew-core-agents',
            title='AGENTS.md — reglas operativas Mugiwara',
            display_path=CANONICAL_CREW_RULES_DISPLAY_PATH,
            source_label='crew-core canonical AGENTS.md',
            read_only=True,
            canonical=True,
            markdown=content,
        )

    def _read_canonical_crew_rules(self) -> str:
        self._ensure_no_symlink_component(self._crew_rules_path)

        resolved = self._crew_rules_path.expanduser().resolve()
        if not resolved.exists() or not resolved.is_file():
            raise self._reject(status.HTTP_503_SERVICE_UNAVAILABLE, 'source_unavailable', 'AGENTS.md canónico no disponible.')

        content = resolved.read_text(encoding='utf-8')
        if len(content.encode('utf-8')) > MAX_CREW_RULES_BYTES:
            raise self._reject(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, 'validation_error', 'AGENTS.md supera el tamaño máximo permitido.')
        return content

    def _ensure_no_symlink_component(self, path: Path) -> None:
        expanded = path.expanduser()
        candidates = [expanded, *expanded.parents]
        for candidate in candidates:
            if candidate == candidate.parent:
                continue
            try:
                if candidate.is_symlink():
                    raise self._reject(status.HTTP_503_SERVICE_UNAVAILABLE, 'source_unavailable', 'La fuente canónica debe leerse directamente, no vía symlink.')
            except OSError:
                raise self._reject(status.HTTP_503_SERVICE_UNAVAILABLE, 'source_unavailable', 'AGENTS.md canónico no disponible.')

    def _reject(self, http_status: int, code: str, message: str) -> HTTPException:
        return HTTPException(status_code=http_status, detail={'code': code, 'message': message})

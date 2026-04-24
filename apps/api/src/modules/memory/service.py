from __future__ import annotations

from dataclasses import asdict

from fastapi import HTTPException, status

from .domain import Freshness, MemoryAgentDetail, MemoryAgentSummary, MemoryRecord, SafeLink

SAFE_MEMORY_RECORDS: tuple[MemoryRecord, ...] = (
    MemoryRecord('luffy', 'Coordina briefs, prioridades y delegación diaria entre especialistas.', 6, '2026-04-24T07:20:00Z', ('orquestación', 'briefs', 'prioridades'), 'Resumen operativo de delegaciones, prioridades activas y criterios de coordinación.', ('Coordina tono y foco entre especialistas.', 'Recoge hábitos de colaboración transversales.', 'No sustituye memoria viva de proyecto.'), 'fresh'),
    MemoryRecord('zoro', 'Mantiene continuidad técnica, verify y decisiones recientes de software.', 6, '2026-04-24T07:25:00Z', ('arquitectura', 'verify', 'software'), 'Continuidad saneada de arquitectura, decisiones técnicas y cierres verificables de software.', ('Pablo prefiere español de España.', 'Prefiere recomendaciones firmes con plan breve.', 'La coordinación general sigue pasando por Luffy.'), 'fresh'),
    MemoryRecord('franky', 'Conserva topología operativa, automatizaciones y continuidad de infraestructura.', 5, '2026-04-24T07:03:00Z', ('infra', 'backups', 'automatización'), 'Resumen de runtime, backups, automatizaciones y decisiones de infraestructura.', ('Coordina temas operativos con Luffy.', 'Comparte señales transversales de mantenimiento.', 'Requiere refresco tras incidencias nocturnas.'), 'stale'),
    MemoryRecord('nami', 'Resume presupuestos, previsiones y señales de prioridad financiera.', 5, '2026-04-24T06:55:00Z', ('finanzas', 'presupuesto', 'prioridades'), 'Resumen financiero operativo sin libros contables ni datos sensibles.', ('Resume dependencias de decisiones presupuestarias.', 'Conecta impacto económico con prioridades.', 'Sirve como contexto relacional, no como ledger.'), 'fresh'),
    MemoryRecord('usopp', 'Agrupa handoffs, decisiones de UI y material editorial del frontend.', 5, '2026-04-24T07:10:00Z', ('docs', 'handoff', 'ui'), 'Resumen de handoffs, decisiones visuales y material editorial vigente.', ('Sostiene copy y posicionamiento.', 'Ajusta tono externo según contexto.', 'No sustituye documentación de producto.'), 'fresh'),
    MemoryRecord('robin', 'Conserva investigaciones estructuradas y fuentes contrastadas.', 4, '2026-04-24T06:48:00Z', ('research', 'fuentes', 'síntesis'), 'Resumen de investigaciones, fuentes contrastadas y síntesis estructurada.', ('Relaciona hallazgos con necesidades de la tripulación.', 'Reduce duplicación de research.', 'No sustituye canon del vault.'), 'fresh'),
    MemoryRecord('jinbe', 'Mantiene criterios legales, contratos y trámites públicos relevantes.', 4, '2026-04-24T06:36:00Z', ('legal', 'contratos', 'boe'), 'Resumen legal de alto nivel sin documentos privados ni datos personales.', ('Pendiente de primeras interacciones relacionales.', 'La ausencia de Honcho no bloquea la lectura built-in.'), 'unknown'),
    MemoryRecord('sanji', 'Recoge logística física, reservas y comparativas operativas del mundo real.', 4, '2026-04-24T06:26:00Z', ('logística', 'reservas', 'ofertas'), 'Resumen logístico saneado sin reservas, ubicaciones ni datos personales.', ('Conviene refrescar tras nuevos viajes o compras.', 'El contexto base sigue siendo útil.'), 'stale'),
    MemoryRecord('chopper', 'Agrupa hallazgos de seguridad, postura defensiva y auditorías técnicas.', 4, '2026-04-24T06:18:00Z', ('ciberseguridad', 'auditoría', 'riesgo'), 'Resumen defensivo sin vulnerabilidades explotables, secretos ni outputs crudos.', ('La memoria built-in sigue disponible.', 'Conviene reintentar la generación de resumen.'), 'unknown'),
    MemoryRecord('brook', 'Conserva continuidad de datos, bases relacionales y análisis de patrones.', 4, '2026-04-24T06:12:00Z', ('datos', 'postgres', 'análisis'), 'Resumen de continuidad de datos sin datasets ni credenciales.', ('Aporta contexto de consumo de datos por otras áreas.', 'Sirve para continuidad transversal de análisis.', 'No reemplaza datasets ni notebooks.'), 'fresh'),
)


class MemoryService:
    def __init__(self, *, records: tuple[MemoryRecord, ...] = SAFE_MEMORY_RECORDS) -> None:
        self._records = {record.slug: record for record in records}

    def catalog_status(self) -> str:
        return 'ready' if self._records else 'not_configured'

    def list_summary(self) -> list[dict]:
        return [asdict(self._to_summary(record)) for record in self._records.values()]

    def get_detail(self, slug: str) -> MemoryAgentDetail:
        record = self._records.get(slug)
        if record is None:
            raise self._reject(status.HTTP_404_NOT_FOUND, 'not_found', 'Memoria no configurada para el agente solicitado.')
        return MemoryAgentDetail(
            mugiwara_slug=record.slug,
            built_in_summary=record.built_in_summary,
            honcho_facts=list(record.honcho_facts[:3]),
            freshness=Freshness(status=record.freshness_status, updated_at=record.last_updated, source_label='built-in + honcho summaries'),
            links=[SafeLink(label='Ver Mugiwara', href='/mugiwaras')],
        )

    def _to_summary(self, record: MemoryRecord) -> MemoryAgentSummary:
        return MemoryAgentSummary(
            mugiwara_slug=record.slug,
            summary=record.summary,
            fact_count=record.fact_count,
            last_updated=record.last_updated,
            badges=list(record.badges),
        )

    def _reject(self, http_status: int, code: str, message: str) -> HTTPException:
        return HTTPException(status_code=http_status, detail={'code': code, 'message': message})

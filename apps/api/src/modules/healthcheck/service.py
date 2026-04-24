from __future__ import annotations

from dataclasses import asdict

from .domain import (
    HealthcheckEvent,
    HealthcheckFreshness,
    HealthcheckModuleCard,
    HealthcheckRecord,
    HealthcheckSummaryBar,
    HealthcheckSummaryItem,
)

SAFE_HEALTHCHECK_RECORDS: tuple[HealthcheckRecord, ...] = (
    HealthcheckRecord('cronjobs', 'Cronjobs', 'warn', 'medium', '2026-04-24T07:41:00Z', 'La revisión nocturna ejecutó, pero queda una advertencia operativa menor en skills del job.', 'Quedan referencias de skills a normalizar.', 'Cron safe summary', 'Actualizado hace 5 min'),
    HealthcheckRecord('backups', 'Backups', 'pass', 'low', '2026-04-24T07:35:00Z', 'Último backup local completado y checksum disponible.', 'Sin alerta activa.', 'Backup safe summary', 'Actualizado hace 11 min'),
    HealthcheckRecord('gateways', 'Gateways', 'warn', 'medium', '2026-04-24T07:44:00Z', 'Latencia por encima del umbral recomendado en la puerta principal.', 'Latencia por encima del umbral recomendado.', 'Gateway safe summary', 'Actualizado hace 2 min'),
    HealthcheckRecord('honcho', 'Honcho', 'stale', 'medium', '2026-04-24T07:22:00Z', 'Parte del contexto relacional está disponible, pero algunos resúmenes necesitan refresco.', 'Resumen relacional pendiente de refresco.', 'Honcho safe summary', 'Actualizado hace 24 min'),
    HealthcheckRecord('docker', 'Docker', 'pass', 'low', '2026-04-24T07:32:00Z', 'Servicios contenedorizados sin incidencias visibles en este corte.', 'Sin alerta activa.', 'Docker safe summary', 'Actualizado hace 14 min'),
    HealthcheckRecord('system', 'System', 'fail', 'high', '2026-04-24T07:39:00Z', 'Se detectó una incidencia abierta de capacidad que requiere revisión prioritaria.', 'Incidencia de capacidad marcada para revisión.', 'System safe summary', 'Actualizado hace 7 min'),
)

SAFE_EVENTS: tuple[HealthcheckEvent, ...] = (
    HealthcheckEvent('evt-cron-nightly', 'cronjobs', 'warn', '2026-04-24T01:33:40+02:00', 'Ejecución nocturna completada con advertencia saneada pendiente de revisión.'),
    HealthcheckEvent('evt-gateway-latency', 'gateways', 'warn', '2026-04-24T07:44:00Z', 'Latencia sostenida por encima del umbral objetivo durante la última ventana de observación.'),
    HealthcheckEvent('evt-system-capacity', 'system', 'fail', '2026-04-24T07:39:00Z', 'Capacidad degradada en un componente operativo; se ha marcado como incidencia para revisión.'),
    HealthcheckEvent('evt-backup-checksum', 'backups', 'pass', '2026-04-24T07:35:00Z', 'Backup reciente validado con checksum sin desviaciones visibles.'),
)

SAFE_PRINCIPLES: tuple[str, ...] = (
    'Repo público',
    'Deny by default',
    'Allowlists explícitas',
    'Sin acceso arbitrario al host',
    'Sin shell remoto',
)

_STATUS_ORDER = {'fail': 4, 'warn': 3, 'stale': 2, 'pass': 1}


class HealthcheckService:
    def __init__(self, *, records: tuple[HealthcheckRecord, ...] = SAFE_HEALTHCHECK_RECORDS, events: tuple[HealthcheckEvent, ...] = SAFE_EVENTS) -> None:
        self._records = records
        self._events = events

    def workspace_status(self) -> str:
        return 'ready' if self._records else 'not_configured'

    def get_workspace(self) -> dict:
        modules = [self._to_module(record) for record in self._records]
        signals = [self._to_signal(record) for record in self._records if record.status in {'warn', 'stale', 'fail'}]
        summary_bar = self._summary_bar(modules)
        events = self._events if self._records else ()
        return {
            'summary_bar': asdict(summary_bar),
            'modules': [asdict(module) for module in modules],
            'events': [asdict(event) for event in events],
            'principles': list(SAFE_PRINCIPLES),
            'signals': [asdict(signal) for signal in signals],
        }

    def _summary_bar(self, modules: list[HealthcheckModuleCard]) -> HealthcheckSummaryBar:
        if not modules:
            return HealthcheckSummaryBar('stale', 0, 0, 0, None)
        incidents = sum(1 for module in modules if module.status == 'fail')
        warnings = sum(1 for module in modules if module.status in {'warn', 'stale'})
        overall = max(modules, key=lambda module: _STATUS_ORDER[module.status]).status
        updated_at = max(module.updated_at for module in modules)
        return HealthcheckSummaryBar(overall, len(modules), warnings, incidents, updated_at)

    def _to_module(self, record: HealthcheckRecord) -> HealthcheckModuleCard:
        return HealthcheckModuleCard(record.module_id, record.label, record.status, record.severity, record.updated_at, record.summary)

    def _to_signal(self, record: HealthcheckRecord) -> HealthcheckSummaryItem:
        return HealthcheckSummaryItem(
            check_id=f'{record.module_id}-safe-signal',
            label=record.label,
            severity=record.severity,
            status=record.status,
            freshness=HealthcheckFreshness(updated_at=record.updated_at, label=record.freshness_label, state='stale' if record.status == 'stale' else 'fresh'),
            warning_text=record.warning_text,
            source_label=record.source_label,
        )

from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone
import os
from typing import TYPE_CHECKING, Mapping

from .domain import (
    HealthcheckCurrentCause,
    HealthcheckEvent,
    HealthcheckFreshness,
    HealthcheckModuleCard,
    HealthcheckOperationalCheck,
    HealthcheckRecord,
    HealthcheckSummaryBar,
    HealthcheckSummaryItem,
    MUGIWARA_GATEWAY_SOURCE_IDS,
    resolve_healthcheck_check_id,
    validate_healthcheck_freshness_state,
    validate_healthcheck_severity,
    validate_healthcheck_status,
)

from .source_adapters import (
    BACKUP_HEALTH_STATUS_MANIFEST,
    CRONJOBS_STATUS_MANIFEST,
    BackupHealthManifestAdapter,
    CronjobsManifestAdapter,
    GatewayStatusManifestAdapter,
    ProjectHealthManifestAdapter,
    VaultSyncManifestAdapter,
)

if TYPE_CHECKING:
    from .registry import HealthcheckSourceSnapshot

SAFE_HEALTHCHECK_RECORDS: tuple[HealthcheckRecord, ...] = (
    HealthcheckRecord('cronjobs', 'Cronjobs', 'warn', 'medium', '2026-04-24T07:41:00Z', 'La revisión nocturna ejecutó, pero queda una advertencia operativa menor en skills del job.', 'Quedan referencias de skills a normalizar.', 'Cron safe summary', 'Actualizado hace 5 min'),
    HealthcheckRecord('backup-health', 'Backups', 'pass', 'low', '2026-04-24T07:35:00Z', 'Último backup local completado y checksum disponible.', 'Sin alerta activa.', 'Backup safe summary', 'Actualizado hace 11 min'),
    HealthcheckRecord('hermes-gateways', 'Gateways', 'warn', 'medium', '2026-04-24T07:44:00Z', 'Latencia por encima del umbral recomendado en la puerta principal.', 'Latencia por encima del umbral recomendado.', 'Gateway safe summary', 'Actualizado hace 2 min'),
    HealthcheckRecord('vault-sync', 'Vault sync', 'stale', 'medium', '2026-04-24T07:22:00Z', 'Parte del estado documental está disponible, pero algunos resúmenes necesitan refresco.', 'Resumen documental pendiente de refresco.', 'Vault sync safe summary', 'Actualizado hace 24 min'),
    HealthcheckRecord('project-health', 'Project health', 'pass', 'low', '2026-04-24T07:32:00Z', 'Workspace de proyecto sin incidencias visibles en este corte.', 'Sin alerta activa.', 'Project safe summary', 'Actualizado hace 14 min'),
    HealthcheckRecord('gateway.zoro', 'Zoro gateway', 'fail', 'high', '2026-04-24T07:39:00Z', 'Se detectó una incidencia abierta de capacidad que requiere revisión prioritaria.', 'Incidencia de capacidad marcada para revisión.', 'Gateway safe summary', 'Actualizado hace 7 min'),
)

SAFE_EVENTS: tuple[HealthcheckEvent, ...] = (
    HealthcheckEvent('evt-cron-nightly', 'cronjobs', 'warn', '2026-04-24T01:33:40+02:00', 'Ejecución nocturna completada con advertencia saneada pendiente de revisión histórica.'),
    HealthcheckEvent('evt-gateway-latency', 'hermes-gateways', 'warn', '2026-04-24T07:44:00Z', 'Latencia registrada en una ventana anterior; no representa por sí sola el estado activo.'),
    HealthcheckEvent('evt-zoro-gateway-capacity', 'gateway.zoro', 'fail', '2026-04-24T07:39:00Z', 'Incidencia saneada registrada en una revisión anterior; no representa por sí sola el estado activo.'),
    HealthcheckEvent('evt-backup-checksum', 'backup-health', 'pass', '2026-04-24T07:35:00Z', 'Backup validado en una revisión anterior sin desviaciones visibles.'),
)

SAFE_PRINCIPLES: tuple[str, ...] = (
    'Repo público',
    'Deny by default',
    'Allowlists explícitas',
    'Sin acceso arbitrario al host',
    'Sin shell remoto',
)

_STATUS_ORDER = {'fail': 5, 'warn': 4, 'stale': 3, 'unknown': 2, 'not_configured': 2, 'pass': 1}


class HealthcheckService:
    def __init__(
        self,
        *,
        records: tuple[HealthcheckRecord, ...] | None = None,
        events: tuple[HealthcheckEvent, ...] = SAFE_EVENTS,
        freshness_state_by_module: dict[str, str] | None = None,
    ) -> None:
        default_snapshot_state = self._default_source_snapshot_state() if records is None else {}
        self._records = records if records is not None else self._records_with_default_sources(default_snapshot_state)
        self._events = events
        self._freshness_state_by_module = {**default_snapshot_state, **(freshness_state_by_module or {})}

    @classmethod
    def from_source_snapshots(cls, snapshots: tuple['HealthcheckSourceSnapshot', ...]) -> 'HealthcheckService':
        return cls(
            records=tuple(snapshot.record for snapshot in snapshots),
            freshness_state_by_module={snapshot.record.module_id: snapshot.freshness_state for snapshot in snapshots},
        )

    def _default_source_snapshot_state(self) -> dict[str, str]:
        vault_snapshot = VaultSyncManifestAdapter().snapshot()
        project_snapshot = ProjectHealthManifestAdapter().snapshot()
        backup_snapshot = BackupHealthManifestAdapter().snapshot()
        cronjobs_snapshot = CronjobsManifestAdapter().snapshot()
        gateway_snapshots = GatewayStatusManifestAdapter().snapshots()
        snapshots = (vault_snapshot, project_snapshot, backup_snapshot, cronjobs_snapshot, *gateway_snapshots)
        self._default_source_records = {snapshot.record.module_id: snapshot.record for snapshot in snapshots}
        return {snapshot.record.module_id: snapshot.freshness_state for snapshot in snapshots}

    def _records_with_default_sources(self, _snapshot_state: dict[str, str]) -> tuple[HealthcheckRecord, ...]:
        source_records = getattr(self, '_default_source_records', {})
        return tuple(source_records.get(record.module_id, record) for record in SAFE_HEALTHCHECK_RECORDS)

    def workspace_status(self) -> str:
        return 'ready' if self._records else 'not_configured'

    def get_workspace(self) -> dict:
        modules = [self._to_module(record) for record in self._records]
        signals = [self._to_signal(record) for record in self._records if record.status in {'warn', 'stale', 'fail', 'unknown', 'not_configured'}]
        summary_bar = self._summary_bar(modules)
        events = self._events if self._records else ()
        return {
            'summary_bar': asdict(summary_bar),
            'operational_checks': [asdict(check) for check in self._operational_checks()],
            'modules': [asdict(module) for module in modules],
            'events': [asdict(event) for event in events],
            'principles': list(SAFE_PRINCIPLES),
            'signals': [asdict(signal) for signal in signals],
        }


    def _operational_checks(self) -> list[HealthcheckOperationalCheck]:
        records_by_id = {record.module_id: record for record in self._records}
        default_source_records = getattr(self, '_default_source_records', {})
        if default_source_records:
            gateway_records = [
                record
                for source_id, record in default_source_records.items()
                if source_id == 'hermes-gateways' or source_id in MUGIWARA_GATEWAY_SOURCE_IDS
            ]
        else:
            gateway_records = [record for record in self._records if record.module_id == 'hermes-gateways' or record.module_id.startswith('gateway.')]
        return [
            self._gateway_operational_check(gateway_records),
            self._static_operational_check(
                'honcho',
                'Honcho',
                'unknown',
                'unknown',
                'Honcho sin manifiesto operativo saneado.',
                display_text='Honcho pendiente de fuente segura · API/DB/Redis sin lectura saneada',
                facts=(
                    {'label': 'API', 'value': 'Sin manifiesto'},
                    {'label': 'DB', 'value': 'Sin manifiesto'},
                    {'label': 'Redis', 'value': 'Sin manifiesto'},
                ),
            ),
            self._static_operational_check(
                'docker_runtime',
                'Docker runtime',
                'unknown',
                'unknown',
                'Docker runtime crítico sin manifiesto operativo saneado.',
                display_text='Docker runtime pendiente de fuente segura · contenedores críticos sin lectura saneada',
                facts=(
                    {'label': 'Críticos OK', 'value': 'Sin manifiesto'},
                ),
            ),
            self._cronjobs_operational_check(records_by_id.get('cronjobs')),
            self._vault_sync_operational_check(records_by_id.get('vault-sync')),
            self._backup_operational_check(records_by_id.get('backup-health')),
        ]

    def _gateway_operational_check(self, records: list[HealthcheckRecord]) -> HealthcheckOperationalCheck:
        aggregate = self._aggregate_operational_check(
            'gateways',
            'Gateways',
            records,
            empty_summary='Gateways sin manifiesto operativo agregado.',
        )
        per_gateway = [record for record in records if record.module_id.startswith('gateway.')]
        total = len(MUGIWARA_GATEWAY_SOURCE_IDS)
        active = sum(1 for record in per_gateway if record.status == 'pass')
        failing = tuple(
            {
                'id': record.module_id.removeprefix('gateway.'),
                'label': record.label.replace(' gateway', ''),
                'status': record.status,
            }
            for record in per_gateway
            if record.status != 'pass'
        )
        display_text = f'{active}/{total} gateways activos'
        if failing:
            failed_labels = ', '.join(item['label'] for item in failing[:3])
            display_text = f'{active}/{total} gateways activos — fallo en: {failed_labels}'
        return self._copy_operational_check(
            aggregate,
            display_text=display_text,
            metric_label='Gateways activos',
            metric_value=f'{active}/{total}',
            failing_items=failing,
        )

    def _cronjobs_operational_check(self, record: HealthcheckRecord | None) -> HealthcheckOperationalCheck:
        check = self._operational_check_from_record(
            'cronjobs',
            'Cronjobs',
            record,
            empty_summary='Cronjobs sin registro operativo allowlisted.',
        )
        jobs = self._safe_cronjob_items() if record is not None else ()
        total = len(jobs)
        operational = sum(1 for item in jobs if item['status'] == 'pass')
        failing = tuple(item for item in jobs if item['status'] != 'pass')
        if total == 0:
            display_text = 'Cronjobs sin registro operativo saneado'
            metric_value = '0/0'
        elif failing:
            failed_labels = ', '.join(item['label'] for item in failing[:3])
            display_text = f'{operational}/{total} cronjobs operativos — fallo en: {failed_labels}'
            metric_value = f'{operational}/{total}'
        else:
            display_text = f'{operational}/{total} cronjobs operativos'
            metric_value = f'{operational}/{total}'
        return self._copy_operational_check(
            check,
            display_text=display_text,
            metric_label='Cronjobs operativos',
            metric_value=metric_value,
            failing_items=failing,
            items=jobs,
        )

    def _vault_sync_operational_check(self, record: HealthcheckRecord | None) -> HealthcheckOperationalCheck:
        check = self._operational_check_from_record(
            'vault_sync',
            'Vault sync',
            record,
            empty_summary='Vault sync sin manifiesto operativo saneado.',
        )
        repo_url = self._safe_url(os.environ.get('MUGIWARA_HEALTHCHECK_VAULT_REPO_URL')) or 'https://github.com/asistentes-mugiwara/vault'
        links = ({'label': 'Repo vault', 'href': repo_url},)
        return self._copy_operational_check(
            check,
            display_text=f'Último correcto: {check.freshness.updated_at or "sin timestamp"} · repo',
            metric_label='Último sync correcto',
            metric_value=check.freshness.updated_at or 'Sin actualización',
            links=links,
        )

    def _backup_operational_check(self, record: HealthcheckRecord | None) -> HealthcheckOperationalCheck:
        check = self._operational_check_from_record(
            'backup',
            'Backup',
            record,
            empty_summary='Backup sin manifiesto operativo saneado.',
        )
        manifest = self._read_safe_manifest(BACKUP_HEALTH_STATUS_MANIFEST)
        retention = manifest.get('retention_count') if isinstance(manifest, Mapping) else None
        checksum = manifest.get('checksum_present') if isinstance(manifest, Mapping) else None
        facts: list[Mapping[str, str]] = []
        if isinstance(retention, int):
            facts.append({'label': 'Retención', 'value': f'{retention}/4'})
        if isinstance(checksum, bool):
            facts.append({'label': 'Checksum', 'value': 'presente' if checksum else 'ausente'})
        drive_url = self._safe_url(os.environ.get('MUGIWARA_HEALTHCHECK_BACKUP_DRIVE_URL'))
        links = ({'label': 'Drive backup', 'href': drive_url},) if drive_url else ()
        suffix = ' · Drive' if drive_url else ' · Drive no configurado'
        return self._copy_operational_check(
            check,
            display_text=f'Último correcto: {check.freshness.updated_at or "sin timestamp"}{suffix}',
            metric_label='Último backup válido',
            metric_value=check.freshness.updated_at or 'Sin actualización',
            links=links,
            facts=tuple(facts),
        )

    def _copy_operational_check(
        self,
        check: HealthcheckOperationalCheck,
        *,
        display_text: str,
        metric_label: str | None = None,
        metric_value: str | None = None,
        failing_items: tuple[Mapping[str, str], ...] = (),
        items: tuple[Mapping[str, str], ...] = (),
        links: tuple[Mapping[str, str], ...] = (),
        facts: tuple[Mapping[str, str], ...] = (),
    ) -> HealthcheckOperationalCheck:
        return HealthcheckOperationalCheck(
            check_id=check.check_id,
            label=check.label,
            status=check.status,
            severity=check.severity,
            updated_at=check.updated_at,
            summary=check.summary,
            freshness=check.freshness,
            display_text=display_text,
            metric_label=metric_label,
            metric_value=metric_value,
            failing_items=failing_items,
            items=items,
            links=links,
            facts=facts,
        )

    def _safe_cronjob_items(self) -> tuple[Mapping[str, str], ...]:
        manifest = self._read_safe_manifest(CRONJOBS_STATUS_MANIFEST)
        jobs = manifest.get('jobs') if isinstance(manifest, Mapping) else None
        if not isinstance(jobs, list):
            return ()
        items: list[Mapping[str, str]] = []
        for index, job in enumerate(jobs, start=1):
            if not isinstance(job, Mapping):
                continue
            raw_status = job.get('last_status') or job.get('status') or job.get('result')
            status = 'pass' if raw_status in {'success', 'ok', 'pass'} else 'fail' if raw_status in {'error', 'failed', 'fail'} else 'warn'
            items.append({'id': f'cronjob-{index}', 'label': f'Cronjob {index}', 'status': status})
        return tuple(items)

    def _read_safe_manifest(self, path) -> Mapping[object, object]:
        try:
            import json

            loaded = json.loads(path.read_text(encoding='utf-8'))
        except Exception:
            return {}
        return loaded if isinstance(loaded, Mapping) else {}

    def _safe_url(self, value: str | None) -> str | None:
        if not value:
            return None
        candidate = value.strip()
        if candidate.startswith('https://github.com/') or candidate.startswith('https://drive.google.com/'):
            return candidate
        return None

    def _aggregate_operational_check(
        self,
        check_id: str,
        label: str,
        records: list[HealthcheckRecord],
        *,
        empty_summary: str,
    ) -> HealthcheckOperationalCheck:
        if not records:
            return self._static_operational_check(check_id, label, 'not_configured', 'unknown', empty_summary)
        record = max(records, key=lambda candidate: _STATUS_ORDER[candidate.status])
        return self._operational_check_from_record(check_id, label, record, empty_summary=empty_summary)

    def _operational_check_from_record(
        self,
        check_id: str,
        label: str,
        record: HealthcheckRecord | None,
        *,
        empty_summary: str,
    ) -> HealthcheckOperationalCheck:
        if record is None:
            return self._static_operational_check(check_id, label, 'not_configured', 'unknown', empty_summary)
        self._validate_record(record)
        freshness_state = self._freshness_state_by_module.get(record.module_id, 'stale' if record.status == 'stale' else 'fresh')
        validate_healthcheck_freshness_state(freshness_state)
        return HealthcheckOperationalCheck(
            check_id=check_id,
            label=label,
            status=record.status,
            severity=record.severity,
            updated_at=record.updated_at or None,
            summary=record.summary,
            freshness=HealthcheckFreshness(updated_at=record.updated_at or None, label=record.freshness_label, state=freshness_state),
            display_text=record.summary,
        )

    def _static_operational_check(
        self,
        check_id: str,
        label: str,
        status: str,
        severity: str,
        summary: str,
        *,
        display_text: str | None = None,
        facts: tuple[Mapping[str, str], ...] = (),
    ) -> HealthcheckOperationalCheck:
        validate_healthcheck_status(status)
        validate_healthcheck_severity(severity)
        return HealthcheckOperationalCheck(
            check_id=check_id,
            label=label,
            status=status,
            severity=severity,
            updated_at=None,
            summary=summary,
            freshness=HealthcheckFreshness(updated_at=None, label='Frescura desconocida', state='unknown'),
            display_text=display_text or summary,
            facts=facts,
        )


    def _summary_bar(self, modules: list[HealthcheckModuleCard]) -> HealthcheckSummaryBar:
        if not modules:
            return HealthcheckSummaryBar('stale', 0, 0, 0, None, None)
        incidents = sum(1 for module in modules if module.status == 'fail')
        warnings = sum(1 for module in modules if module.status in {'warn', 'stale', 'unknown', 'not_configured'})
        overall_record = max(self._records, key=lambda record: _STATUS_ORDER[record.status])
        overall = overall_record.status
        updated_at = self._latest_updated_at(modules)
        current_cause = self._current_cause(overall_record) if overall != 'pass' else None
        return HealthcheckSummaryBar(overall, len(modules), warnings, incidents, updated_at, current_cause)

    def _current_cause(self, record: HealthcheckRecord) -> HealthcheckCurrentCause:
        freshness_state = self._freshness_state_by_module.get(record.module_id, 'stale' if record.status == 'stale' else 'fresh')
        validate_healthcheck_freshness_state(freshness_state)
        return HealthcheckCurrentCause(
            source_id=record.module_id,
            label=record.label,
            status=record.status,
            severity=record.severity,
            summary=record.summary,
            warning_text=record.warning_text,
            freshness_state=freshness_state,
        )

    def _latest_updated_at(self, modules: list[HealthcheckModuleCard]) -> str | None:
        latest: tuple[datetime, str] | None = None
        for module in modules:
            parsed = _parse_timestamp(module.updated_at)
            if parsed is None:
                continue
            if latest is None or parsed > latest[0]:
                latest = (parsed, module.updated_at)
        return latest[1] if latest else None

    def _to_module(self, record: HealthcheckRecord) -> HealthcheckModuleCard:
        self._validate_record(record)
        return HealthcheckModuleCard(record.module_id, record.label, record.status, record.severity, record.updated_at, record.summary)

    def _to_signal(self, record: HealthcheckRecord) -> HealthcheckSummaryItem:
        self._validate_record(record)
        freshness_state = self._freshness_state_by_module.get(record.module_id, 'stale' if record.status == 'stale' else 'fresh')
        validate_healthcheck_freshness_state(freshness_state)
        return HealthcheckSummaryItem(
            check_id=resolve_healthcheck_check_id(record.module_id),
            label=record.label,
            severity=record.severity,
            status=record.status,
            freshness=HealthcheckFreshness(updated_at=record.updated_at, label=record.freshness_label, state=freshness_state),
            warning_text=record.warning_text,
            source_label=record.source_label,
        )

    def _validate_record(self, record: HealthcheckRecord) -> None:
        resolve_healthcheck_check_id(record.module_id)
        validate_healthcheck_status(record.status)
        validate_healthcheck_severity(record.severity)


def _parse_timestamp(value: str) -> datetime | None:
    try:
        normalized = value.replace('Z', '+00:00') if value.endswith('Z') else value
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed

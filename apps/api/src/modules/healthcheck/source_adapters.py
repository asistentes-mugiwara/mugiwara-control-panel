from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Mapping

from .domain import HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS, MUGIWARA_GATEWAY_SOURCE_IDS
from .registry import HealthcheckSourceRegistry, HealthcheckSourceSnapshot

VAULT_SYNC_STATUS_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/vault-sync-status.json')
BACKUP_HEALTH_STATUS_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/backup-health-status.json')
PROJECT_HEALTH_STATUS_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/project-health-status.json')
GATEWAY_STATUS_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/gateway-status.json')
CRONJOBS_STATUS_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/cronjobs-status.json')
DOCKER_RUNTIME_STATUS_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/docker-runtime-status.json')
HONCHO_STATUS_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/honcho-status.json')


class VaultSyncManifestAdapter:
    """Fixed, allowlisted reader for Franky-owned vault sync status manifests."""

    source_id = 'vault-sync'

    def __init__(
        self,
        *,
        manifest_path: Path = VAULT_SYNC_STATUS_MANIFEST,
        registry: HealthcheckSourceRegistry | None = None,
    ) -> None:
        self._manifest_path = manifest_path
        self._registry = registry or HealthcheckSourceRegistry()

    def snapshot(self, *, now: str | datetime | None = None) -> HealthcheckSourceSnapshot:
        if not self._manifest_path.exists():
            return self._registry.normalize_absent(self.source_id)

        try:
            manifest = json.loads(self._manifest_path.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError, UnicodeDecodeError):
            return self._registry.normalize_unreadable(self.source_id)

        if not isinstance(manifest, Mapping):
            return self._registry.normalize_unreadable(self.source_id)

        raw = self._manifest_to_raw(manifest, now=self._parse_now(now))
        return self._registry.normalize(self.source_id, raw)

    def _manifest_to_raw(self, manifest: Mapping[object, object], *, now: datetime) -> dict[str, str]:
        updated_at = self._safe_timestamp(manifest.get('last_success_at')) or self._safe_timestamp(manifest.get('updated_at'))
        if updated_at is None:
            return {
                'status': 'unknown',
                'severity': 'unknown',
                'updated_at': '',
                'summary': 'Vault sync sin timestamp seguro disponible.',
                'warning_text': 'Vault sync sin timestamp seguro.',
                'source_label': 'Vault sync safe manifest',
                'freshness_label': 'Frescura desconocida',
                'freshness_state': 'unknown',
            }

        result = self._safe_result(manifest.get('status')) or self._safe_result(manifest.get('result'))
        age_minutes = (now - _parse_timestamp(updated_at)).total_seconds() / 60
        thresholds = HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS[self.source_id]

        if result in {'error', 'failed', 'fail'}:
            status = 'fail'
            severity = 'high'
            summary = 'Vault sync reporta fallo en su manifiesto seguro.'
            warning = 'Vault sync falló; revisar fuente operacional.'
            freshness_state = 'stale'
        elif result in {'dirty', 'diverged', 'ahead', 'behind', 'stale', 'warning', 'warn'}:
            status = 'warn'
            severity = 'medium'
            summary = 'Vault sync requiere revisión según manifiesto seguro.'
            warning = 'Vault sync con divergencia o cambios pendientes.'
            freshness_state = 'stale'
        elif age_minutes >= thresholds['fail_after_minutes']:
            status = 'stale'
            severity = 'high'
            summary = 'Vault sync no tiene actualización reciente.'
            warning = 'Vault sync stale; revisar fuente operacional.'
            freshness_state = 'stale'
        elif age_minutes >= thresholds['warn_after_minutes']:
            status = 'warn'
            severity = 'medium'
            summary = 'Vault sync se acerca al umbral de frescura.'
            warning = 'Vault sync próximo a stale.'
            freshness_state = 'stale'
        else:
            status = 'pass'
            severity = 'low'
            summary = 'Vault sincronizado recientemente.'
            warning = 'Sin alerta activa.'
            freshness_state = 'fresh'

        return {
            'status': status,
            'severity': severity,
            'updated_at': updated_at,
            'summary': summary,
            'warning_text': warning,
            'source_label': 'Vault sync safe manifest',
            'freshness_label': self._freshness_label(age_minutes),
            'freshness_state': freshness_state,
        }

    def _parse_now(self, value: str | datetime | None) -> datetime:
        if value is None:
            return datetime.now(timezone.utc)
        if isinstance(value, datetime):
            return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        return _parse_timestamp(value)

    def _safe_timestamp(self, value: object) -> str | None:
        if not isinstance(value, str):
            return None
        try:
            _parse_timestamp(value)
        except ValueError:
            return None
        return value

    def _safe_result(self, value: object) -> str | None:
        if not isinstance(value, str):
            return None
        normalized = value.strip().lower()
        allowed = {'success', 'ok', 'pass', 'error', 'failed', 'fail', 'dirty', 'diverged', 'ahead', 'behind', 'stale', 'warning', 'warn'}
        return normalized if normalized in allowed else None

    def _freshness_label(self, age_minutes: float) -> str:
        if age_minutes < 1:
            return 'Actualizado hace menos de 1 min'
        rounded_minutes = int(age_minutes)
        return f'Actualizado hace {rounded_minutes} min'


class BackupHealthManifestAdapter:
    """Fixed, allowlisted reader for Franky-owned local backup status manifests."""

    source_id = 'backup-health'

    def __init__(
        self,
        *,
        manifest_path: Path = BACKUP_HEALTH_STATUS_MANIFEST,
        registry: HealthcheckSourceRegistry | None = None,
    ) -> None:
        self._manifest_path = manifest_path
        self._registry = registry or HealthcheckSourceRegistry()

    def snapshot(self, *, now: str | datetime | None = None) -> HealthcheckSourceSnapshot:
        if not self._manifest_path.exists():
            return self._registry.normalize_absent(self.source_id)

        try:
            manifest = json.loads(self._manifest_path.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError, UnicodeDecodeError):
            return self._registry.normalize_unreadable(self.source_id)

        if not isinstance(manifest, Mapping):
            return self._registry.normalize_unreadable(self.source_id)

        raw = self._manifest_to_raw(manifest, now=self._parse_now(now))
        return self._registry.normalize(self.source_id, raw)

    def _manifest_to_raw(self, manifest: Mapping[object, object], *, now: datetime) -> dict[str, str]:
        updated_at = self._safe_timestamp(manifest.get('last_success_at')) or self._safe_timestamp(manifest.get('updated_at'))
        if updated_at is None:
            return {
                'status': 'unknown',
                'severity': 'unknown',
                'updated_at': '',
                'summary': 'Backup local sin timestamp seguro disponible.',
                'warning_text': 'Backup local sin timestamp seguro.',
                'source_label': 'Backup safe manifest',
                'freshness_label': 'Frescura desconocida',
                'freshness_state': 'unknown',
            }

        result = self._safe_result(manifest.get('status')) or self._safe_result(manifest.get('result'))
        checksum_present = self._safe_bool(manifest.get('checksum_present'))
        retention_count = self._safe_int(manifest.get('retention_count'))
        age_minutes = (now - _parse_timestamp(updated_at)).total_seconds() / 60
        thresholds = HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS[self.source_id]

        if result in {'error', 'failed', 'fail'}:
            status = 'fail'
            severity = 'high'
            summary = 'Backup local reporta fallo en su manifiesto seguro.'
            warning = 'Backup local falló; revisar fuente operacional.'
            freshness_state = 'stale'
        elif result in {'stale', 'warning', 'warn'}:
            status = 'warn'
            severity = 'medium'
            summary = 'Backup local requiere revisión según manifiesto seguro.'
            warning = 'Backup local con degradación explícita.'
            freshness_state = 'stale'
        elif result not in {'success', 'ok', 'pass'}:
            status = 'warn'
            severity = 'medium'
            summary = 'Backup local sin resultado seguro disponible.'
            warning = 'Backup local sin resultado positivo explícito.'
            freshness_state = 'stale'
        elif checksum_present is not True:
            status = 'warn'
            severity = 'medium'
            summary = 'Backup local sin checksum seguro disponible.'
            warning = 'Backup local sin checksum visible.'
            freshness_state = 'stale'
        elif retention_count is None:
            status = 'warn'
            severity = 'medium'
            summary = 'Backup local sin retención segura disponible.'
            warning = 'Backup local sin retención verificable.'
            freshness_state = 'stale'
        elif retention_count < 4:
            status = 'warn'
            severity = 'medium'
            summary = 'Backup local por debajo de la retención esperada.'
            warning = 'Backup local con retención incompleta.'
            freshness_state = 'stale'
        elif age_minutes >= thresholds['fail_after_minutes']:
            status = 'stale'
            severity = 'high'
            summary = 'Backup local stale según manifiesto seguro.'
            warning = 'Backup local stale; revisar fuente operacional.'
            freshness_state = 'stale'
        elif age_minutes >= thresholds['warn_after_minutes']:
            status = 'warn'
            severity = 'medium'
            summary = 'Backup local se acerca al umbral de frescura.'
            warning = 'Backup local próximo a stale.'
            freshness_state = 'stale'
        else:
            status = 'pass'
            severity = 'low'
            summary = 'Backup local reciente con checksum disponible.'
            warning = 'Sin alerta activa.'
            freshness_state = 'fresh'

        return {
            'status': status,
            'severity': severity,
            'updated_at': updated_at,
            'summary': summary,
            'warning_text': warning,
            'source_label': 'Backup safe manifest',
            'freshness_label': self._freshness_label(age_minutes),
            'freshness_state': freshness_state,
        }

    def _parse_now(self, value: str | datetime | None) -> datetime:
        if value is None:
            return datetime.now(timezone.utc)
        if isinstance(value, datetime):
            return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        return _parse_timestamp(value)

    def _safe_timestamp(self, value: object) -> str | None:
        if not isinstance(value, str):
            return None
        try:
            _parse_timestamp(value)
        except ValueError:
            return None
        return value

    def _safe_result(self, value: object) -> str | None:
        if not isinstance(value, str):
            return None
        normalized = value.strip().lower()
        allowed = {'success', 'ok', 'pass', 'error', 'failed', 'fail', 'stale', 'warning', 'warn'}
        return normalized if normalized in allowed else None

    def _safe_bool(self, value: object) -> bool | None:
        return value if isinstance(value, bool) else None

    def _safe_int(self, value: object) -> int | None:
        if isinstance(value, bool):
            return None
        return value if isinstance(value, int) else None

    def _freshness_label(self, age_minutes: float) -> str:
        if age_minutes < 1:
            return 'Actualizado hace menos de 1 min'
        rounded_minutes = int(age_minutes)
        return f'Actualizado hace {rounded_minutes} min'

class ProjectHealthManifestAdapter:
    """Fixed, allowlisted reader for Zoro-owned repo-local project health manifests."""

    source_id = 'project-health'

    def __init__(
        self,
        *,
        manifest_path: Path = PROJECT_HEALTH_STATUS_MANIFEST,
        registry: HealthcheckSourceRegistry | None = None,
    ) -> None:
        self._manifest_path = manifest_path
        self._registry = registry or HealthcheckSourceRegistry()

    def snapshot(self, *, now: str | datetime | None = None) -> HealthcheckSourceSnapshot:
        if not self._manifest_path.exists():
            return self._registry.normalize_absent(self.source_id)

        try:
            manifest = json.loads(self._manifest_path.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError, UnicodeDecodeError):
            return self._registry.normalize_unreadable(self.source_id)

        if not isinstance(manifest, Mapping):
            return self._registry.normalize_unreadable(self.source_id)

        raw = self._manifest_to_raw(manifest, now=self._parse_now(now))
        return self._registry.normalize(self.source_id, raw)

    def _manifest_to_raw(self, manifest: Mapping[object, object], *, now: datetime) -> dict[str, str]:
        updated_at = self._safe_timestamp(manifest.get('updated_at')) or self._safe_timestamp(manifest.get('last_success_at'))
        if updated_at is None:
            return {
                'status': 'unknown',
                'severity': 'unknown',
                'updated_at': '',
                'summary': 'Repo local sin timestamp seguro disponible.',
                'warning_text': 'Project health sin timestamp seguro.',
                'source_label': 'Project health safe manifest',
                'freshness_label': 'Frescura desconocida',
                'freshness_state': 'unknown',
            }

        result = self._safe_result(manifest.get('status')) or self._safe_result(manifest.get('result'))
        workspace_clean = self._safe_bool(manifest.get('workspace_clean'))
        main_branch = self._safe_bool(manifest.get('main_branch'))
        remote_synced = self._safe_bool(manifest.get('remote_synced'))
        age_minutes = (now - _parse_timestamp(updated_at)).total_seconds() / 60
        thresholds = HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS[self.source_id]

        if result in {'error', 'failed', 'fail'}:
            status = 'fail'
            severity = 'high'
            summary = 'Repo local reporta fallo en su manifiesto seguro.'
            warning = 'Project health falló; revisar repo local.'
            freshness_state = 'stale'
        elif result in {'dirty', 'diverged', 'ahead', 'behind', 'stale', 'warning', 'warn'}:
            status = 'warn'
            severity = 'medium'
            summary = 'Repo local requiere revisión según manifiesto seguro.'
            warning = 'Repo local con degradación explícita.'
            freshness_state = 'stale'
        elif result not in {'success', 'ok', 'pass'} or workspace_clean is None or main_branch is None or remote_synced is None:
            status = 'warn'
            severity = 'medium'
            summary = 'Repo local sin estado seguro completo disponible.'
            warning = 'Project health sin resultado completo.'
            freshness_state = 'stale'
        elif workspace_clean is not True:
            status = 'warn'
            severity = 'medium'
            summary = 'Repo local con cambios pendientes según manifiesto seguro.'
            warning = 'Repo local con cambios pendientes.'
            freshness_state = 'stale'
        elif main_branch is not True:
            status = 'warn'
            severity = 'medium'
            summary = 'Repo local fuera de la rama estable esperada.'
            warning = 'Repo local no está en main según manifiesto seguro.'
            freshness_state = 'stale'
        elif remote_synced is not True:
            status = 'warn'
            severity = 'medium'
            summary = 'Repo local pendiente de sincronización remota según manifiesto seguro.'
            warning = 'Repo local pendiente de sincronización.'
            freshness_state = 'stale'
        elif age_minutes >= thresholds['fail_after_minutes']:
            status = 'stale'
            severity = 'high'
            summary = 'Repo local stale según manifiesto seguro.'
            warning = 'Project health stale; revisar fuente operacional.'
            freshness_state = 'stale'
        elif age_minutes >= thresholds['warn_after_minutes']:
            status = 'warn'
            severity = 'medium'
            summary = 'Repo local se acerca al umbral de frescura.'
            warning = 'Project health próximo a stale.'
            freshness_state = 'stale'
        else:
            status = 'pass'
            severity = 'low'
            summary = 'Repo local revisado recientemente sin incidencias visibles.'
            warning = 'Sin alerta activa.'
            freshness_state = 'fresh'

        return {
            'status': status,
            'severity': severity,
            'updated_at': updated_at,
            'summary': summary,
            'warning_text': warning,
            'source_label': 'Project health safe manifest',
            'freshness_label': self._freshness_label(age_minutes),
            'freshness_state': freshness_state,
        }

    def _parse_now(self, value: str | datetime | None) -> datetime:
        if value is None:
            return datetime.now(timezone.utc)
        if isinstance(value, datetime):
            return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        return _parse_timestamp(value)

    def _safe_timestamp(self, value: object) -> str | None:
        if not isinstance(value, str):
            return None
        try:
            _parse_timestamp(value)
        except ValueError:
            return None
        return value

    def _safe_result(self, value: object) -> str | None:
        if not isinstance(value, str):
            return None
        normalized = value.strip().lower()
        allowed = {'success', 'ok', 'pass', 'error', 'failed', 'fail', 'dirty', 'diverged', 'ahead', 'behind', 'stale', 'warning', 'warn'}
        return normalized if normalized in allowed else None

    def _safe_bool(self, value: object) -> bool | None:
        return value if isinstance(value, bool) else None

    def _freshness_label(self, age_minutes: float) -> str:
        if age_minutes < 1:
            return 'Actualizado hace menos de 1 min'
        rounded_minutes = int(age_minutes)
        return f'Actualizado hace {rounded_minutes} min'


class CronjobsManifestAdapter:
    """Fixed, allowlisted reader for Franky-owned active cronjobs status manifests."""

    source_id = 'cronjobs'

    def __init__(
        self,
        *,
        manifest_path: Path = CRONJOBS_STATUS_MANIFEST,
        registry: HealthcheckSourceRegistry | None = None,
    ) -> None:
        self._manifest_path = manifest_path
        self._registry = registry or HealthcheckSourceRegistry()

    def snapshot(self, *, now: str | datetime | None = None) -> HealthcheckSourceSnapshot:
        if not self._manifest_path.exists():
            return self._registry.normalize_absent(self.source_id)

        try:
            manifest = json.loads(self._manifest_path.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError, UnicodeDecodeError):
            return self._registry.normalize_unreadable(self.source_id)

        if not isinstance(manifest, Mapping):
            return self._registry.normalize_unreadable(self.source_id)

        raw = self._manifest_to_raw(manifest, now=self._parse_now(now))
        return self._registry.normalize(self.source_id, raw)

    def _manifest_to_raw(self, manifest: Mapping[object, object], *, now: datetime) -> dict[str, str]:
        updated_at = self._safe_timestamp(manifest.get('updated_at')) or self._safe_timestamp(manifest.get('last_success_at'))
        if updated_at is None:
            return {
                'status': 'unknown',
                'severity': 'unknown',
                'updated_at': '',
                'summary': 'Cronjobs sin timestamp seguro disponible.',
                'warning_text': 'Cronjobs sin timestamp seguro.',
                'source_label': 'Cronjobs safe manifest',
                'freshness_label': 'Frescura desconocida',
                'freshness_state': 'unknown',
            }

        jobs = manifest.get('jobs')
        if not isinstance(jobs, list) or len(jobs) == 0:
            return {
                'status': 'not_configured',
                'severity': 'unknown',
                'updated_at': updated_at,
                'summary': 'Cronjobs sin registro allowlisted disponible.',
                'warning_text': 'Cronjobs no configurados en manifiesto seguro.',
                'source_label': 'Cronjobs safe manifest',
                'freshness_label': 'Frescura desconocida',
                'freshness_state': 'unknown',
            }

        manifest_result = self._safe_result(manifest.get('status')) or self._safe_result(manifest.get('result'))
        manifest_age_minutes = (now - _parse_timestamp(updated_at)).total_seconds() / 60
        thresholds = HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS[self.source_id]
        job_states = [self._job_state(job, now=now) for job in jobs]

        if manifest_result in {'error', 'failed', 'fail'} or any(state == 'failed' for state in job_states):
            status = 'fail'
            severity = 'high'
            summary = 'Cronjob crítico reporta fallo según manifiesto seguro.'
            warning = 'Cronjob crítico falló; revisar fuente operacional.'
            freshness_state = 'stale'
        elif manifest_result in {'stale', 'warning', 'warn'}:
            status = 'warn'
            severity = 'medium'
            summary = 'Cronjobs requieren revisión según manifiesto seguro.'
            warning = 'Cronjobs con degradación explícita.'
            freshness_state = 'stale'
        elif any(state == 'partial' for state in job_states) or manifest_result not in {'success', 'ok', 'pass'}:
            status = 'warn'
            severity = 'medium'
            summary = 'Cronjobs sin estado seguro completo disponible.'
            warning = 'Cronjobs sin resultado completo.'
            freshness_state = 'stale'
        elif manifest_age_minutes >= thresholds['fail_after_minutes'] or any(state == 'stale' for state in job_states):
            status = 'stale'
            severity = 'high'
            summary = 'Cronjobs críticos stale según manifiesto seguro.'
            warning = 'Cronjobs críticos stale; revisar fuente operacional.'
            freshness_state = 'stale'
        elif manifest_age_minutes >= thresholds['warn_after_minutes']:
            status = 'warn'
            severity = 'medium'
            summary = 'Cronjobs se acercan al umbral de frescura.'
            warning = 'Cronjobs próximos a stale.'
            freshness_state = 'stale'
        else:
            status = 'pass'
            severity = 'low'
            summary = 'Cronjobs críticos ejecutados recientemente según manifiesto seguro.'
            warning = 'Sin alerta activa.'
            freshness_state = 'fresh'

        return {
            'status': status,
            'severity': severity,
            'updated_at': updated_at,
            'summary': summary,
            'warning_text': warning,
            'source_label': 'Cronjobs safe manifest',
            'freshness_label': self._freshness_label(manifest_age_minutes),
            'freshness_state': freshness_state,
        }

    def _job_state(self, job: object, *, now: datetime) -> str:
        if not isinstance(job, Mapping):
            return 'partial'
        last_status = self._safe_result(job.get('last_status')) or self._safe_result(job.get('status')) or self._safe_result(job.get('result'))
        last_run_at = self._safe_timestamp(job.get('last_run_at')) or self._safe_timestamp(job.get('updated_at'))
        criticality = self._safe_criticality(job.get('criticality'))
        if last_status in {'error', 'failed', 'fail'}:
            return 'failed'
        if last_status in {'stale', 'warning', 'warn'}:
            return 'stale'
        if last_status not in {'success', 'ok', 'pass'} or last_run_at is None or criticality is None:
            return 'partial'
        if criticality != 'critical':
            return 'ok'
        age_minutes = (now - _parse_timestamp(last_run_at)).total_seconds() / 60
        thresholds = HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS[self.source_id]
        return 'stale' if age_minutes >= thresholds['warn_after_minutes'] else 'ok'

    def _parse_now(self, value: str | datetime | None) -> datetime:
        if value is None:
            return datetime.now(timezone.utc)
        if isinstance(value, datetime):
            return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        return _parse_timestamp(value)

    def _safe_timestamp(self, value: object) -> str | None:
        if not isinstance(value, str):
            return None
        try:
            _parse_timestamp(value)
        except ValueError:
            return None
        return value

    def _safe_result(self, value: object) -> str | None:
        if not isinstance(value, str):
            return None
        normalized = value.strip().lower()
        allowed = {'success', 'ok', 'pass', 'error', 'failed', 'fail', 'stale', 'warning', 'warn'}
        return normalized if normalized in allowed else None

    def _safe_criticality(self, value: object) -> str | None:
        if not isinstance(value, str):
            return None
        normalized = value.strip().lower()
        return normalized if normalized in {'critical', 'normal'} else None

    def _freshness_label(self, age_minutes: float) -> str:
        if age_minutes < 1:
            return 'Actualizado hace menos de 1 min'
        rounded_minutes = int(age_minutes)
        return f'Actualizado hace {rounded_minutes} min'


class GatewayStatusManifestAdapter:
    """Fixed, allowlisted reader for Franky-owned Hermes gateway status manifests."""

    global_source_id = 'hermes-gateways'

    def __init__(
        self,
        *,
        manifest_path: Path = GATEWAY_STATUS_MANIFEST,
        registry: HealthcheckSourceRegistry | None = None,
    ) -> None:
        self._manifest_path = manifest_path
        self._registry = registry or HealthcheckSourceRegistry()

    def snapshots(self, *, now: str | datetime | None = None) -> tuple[HealthcheckSourceSnapshot, ...]:
        source_ids = self._source_ids()
        if not self._manifest_path.exists():
            return tuple(self._registry.normalize_absent(source_id) for source_id in source_ids)

        try:
            manifest = json.loads(self._manifest_path.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError, UnicodeDecodeError):
            return tuple(self._registry.normalize_unreadable(source_id) for source_id in source_ids)

        if not isinstance(manifest, Mapping):
            return tuple(self._registry.normalize_unreadable(source_id) for source_id in source_ids)

        parsed_now = self._parse_now(now)
        gateway_raw_by_source = self._gateway_raw_by_source(manifest, now=parsed_now)
        global_raw = self._global_raw(gateway_raw_by_source, manifest=manifest, now=parsed_now)
        snapshots: list[HealthcheckSourceSnapshot] = [self._registry.normalize(self.global_source_id, global_raw)]
        for source_id in MUGIWARA_GATEWAY_SOURCE_IDS:
            snapshots.append(self._registry.normalize(source_id, gateway_raw_by_source[source_id]))
        return tuple(snapshots)

    def _source_ids(self) -> tuple[str, ...]:
        return (self.global_source_id, *MUGIWARA_GATEWAY_SOURCE_IDS)

    def _gateway_raw_by_source(self, manifest: Mapping[object, object], *, now: datetime) -> dict[str, dict[str, str]]:
        updated_at = self._safe_timestamp(manifest.get('updated_at')) or self._safe_timestamp(manifest.get('last_success_at'))
        gateways = manifest.get('gateways')
        if updated_at is None:
            return {
                source_id: self._raw_unknown(
                    source_id,
                    summary='Gateway sin timestamp seguro disponible.',
                    warning='Gateway sin timestamp seguro.',
                )
                for source_id in MUGIWARA_GATEWAY_SOURCE_IDS
            }
        if not isinstance(gateways, Mapping):
            return {
                source_id: self._raw_not_configured(
                    source_id,
                    updated_at=updated_at,
                    summary='Gateway sin resumen allowlisted disponible.',
                    warning='Gateway no configurado en manifiesto seguro.',
                )
                for source_id in MUGIWARA_GATEWAY_SOURCE_IDS
            }

        raw_by_source: dict[str, dict[str, str]] = {}
        age_minutes = (now - _parse_timestamp(updated_at)).total_seconds() / 60
        for source_id in MUGIWARA_GATEWAY_SOURCE_IDS:
            slug = source_id.removeprefix('gateway.')
            entry = gateways.get(slug)
            raw_by_source[source_id] = self._gateway_entry_to_raw(source_id, entry, updated_at=updated_at, age_minutes=age_minutes)
        return raw_by_source

    def _gateway_entry_to_raw(self, source_id: str, entry: object, *, updated_at: str, age_minutes: float) -> dict[str, str]:
        if not isinstance(entry, Mapping):
            return self._raw_not_configured(
                source_id,
                updated_at=updated_at,
                summary='Gateway sin resumen allowlisted disponible.',
                warning='Gateway no configurado en manifiesto seguro.',
            )

        explicit_status = self._safe_result(entry.get('status')) or self._safe_result(entry.get('result'))
        active = self._safe_bool(entry.get('active'))
        thresholds = HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS[source_id]

        if explicit_status in {'error', 'failed', 'fail'} or active is False:
            status = 'fail'
            severity = 'high'
            summary = 'Gateway no activo según manifiesto seguro.'
            warning = 'Gateway no activo.'
            freshness_state = 'stale'
        elif explicit_status in {'stale', 'warning', 'warn'}:
            status = 'warn'
            severity = 'medium'
            summary = 'Gateway requiere revisión según manifiesto seguro.'
            warning = 'Gateway con degradación explícita.'
            freshness_state = 'stale'
        elif active is not True and explicit_status not in {'success', 'ok', 'pass'}:
            status = 'not_configured'
            severity = 'unknown'
            summary = 'Gateway sin estado seguro completo disponible.'
            warning = 'Gateway sin estado positivo explícito.'
            freshness_state = 'unknown'
        elif age_minutes >= thresholds['fail_after_minutes']:
            status = 'stale'
            severity = 'high'
            summary = 'Gateway stale según manifiesto seguro.'
            warning = 'Gateway stale; revisar fuente operacional.'
            freshness_state = 'stale'
        elif age_minutes >= thresholds['warn_after_minutes']:
            status = 'warn'
            severity = 'medium'
            summary = 'Gateway se acerca al umbral de frescura.'
            warning = 'Gateway próximo a stale.'
            freshness_state = 'stale'
        else:
            status = 'pass'
            severity = 'low'
            summary = 'Gateway activo según manifiesto seguro.'
            warning = 'Sin alerta activa.'
            freshness_state = 'fresh'

        return {
            'status': status,
            'severity': severity,
            'updated_at': updated_at,
            'summary': summary,
            'warning_text': warning,
            'source_label': 'Gateway safe manifest',
            'freshness_label': self._freshness_label(age_minutes),
            'freshness_state': freshness_state,
        }

    def _global_raw(self, gateway_raw_by_source: Mapping[str, Mapping[str, str]], *, manifest: Mapping[object, object], now: datetime) -> dict[str, str]:
        updated_at = self._safe_timestamp(manifest.get('updated_at')) or self._safe_timestamp(manifest.get('last_success_at'))
        if updated_at is None:
            return self._raw_unknown(
                self.global_source_id,
                summary='Gateways sin timestamp seguro disponible.',
                warning='Gateways sin timestamp seguro.',
            )

        age_minutes = (now - _parse_timestamp(updated_at)).total_seconds() / 60
        thresholds = HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS[self.global_source_id]
        statuses = {raw.get('status', 'unknown') for raw in gateway_raw_by_source.values()}

        if 'fail' in statuses:
            status = 'fail'
            severity = 'high'
            summary = 'Uno o más gateways no están activos según manifiesto seguro.'
            warning = 'Gateway crítico no activo.'
            freshness_state = 'stale'
        elif age_minutes >= thresholds['fail_after_minutes']:
            status = 'stale'
            severity = 'high'
            summary = 'Gateways stale según manifiesto seguro.'
            warning = 'Gateways stale; revisar fuente operacional.'
            freshness_state = 'stale'
        elif statuses <= {'pass'} and age_minutes < thresholds['warn_after_minutes']:
            status = 'pass'
            severity = 'low'
            summary = 'Gateways allowlisted activos según manifiesto seguro.'
            warning = 'Sin alerta activa.'
            freshness_state = 'fresh'
        elif statuses & {'not_configured', 'unknown'}:
            status = 'warn'
            severity = 'medium'
            summary = 'Gateways con cobertura parcial en manifiesto seguro.'
            warning = 'Gateways no configurados o desconocidos.'
            freshness_state = 'stale'
        else:
            status = 'warn'
            severity = 'medium'
            summary = 'Gateways requieren revisión según manifiesto seguro.'
            warning = 'Gateways con degradación explícita.'
            freshness_state = 'stale'

        return {
            'status': status,
            'severity': severity,
            'updated_at': updated_at,
            'summary': summary,
            'warning_text': warning,
            'source_label': 'Gateway safe manifest',
            'freshness_label': self._freshness_label(age_minutes),
            'freshness_state': freshness_state,
        }

    def _raw_unknown(self, source_id: str, *, summary: str, warning: str) -> dict[str, str]:
        return {
            'status': 'unknown',
            'severity': 'unknown',
            'updated_at': '',
            'summary': summary,
            'warning_text': warning,
            'source_label': 'Gateway safe manifest',
            'freshness_label': 'Frescura desconocida',
            'freshness_state': 'unknown',
        }

    def _raw_not_configured(self, source_id: str, *, updated_at: str, summary: str, warning: str) -> dict[str, str]:
        return {
            'status': 'not_configured',
            'severity': 'unknown',
            'updated_at': updated_at,
            'summary': summary,
            'warning_text': warning,
            'source_label': 'Gateway safe manifest',
            'freshness_label': 'Frescura desconocida',
            'freshness_state': 'unknown',
        }

    def _parse_now(self, value: str | datetime | None) -> datetime:
        if value is None:
            return datetime.now(timezone.utc)
        if isinstance(value, datetime):
            return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        return _parse_timestamp(value)

    def _safe_timestamp(self, value: object) -> str | None:
        if not isinstance(value, str):
            return None
        try:
            _parse_timestamp(value)
        except ValueError:
            return None
        return value

    def _safe_result(self, value: object) -> str | None:
        if not isinstance(value, str):
            return None
        normalized = value.strip().lower()
        allowed = {'success', 'ok', 'pass', 'error', 'failed', 'fail', 'stale', 'warning', 'warn'}
        return normalized if normalized in allowed else None

    def _safe_bool(self, value: object) -> bool | None:
        return value if isinstance(value, bool) else None

    def _freshness_label(self, age_minutes: float) -> str:
        if age_minutes < 1:
            return 'Actualizado hace menos de 1 min'
        rounded_minutes = int(age_minutes)
        return f'Actualizado hace {rounded_minutes} min'




def _parse_timestamp(value: str) -> datetime:
    normalized = value.replace('Z', '+00:00') if value.endswith('Z') else value
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed

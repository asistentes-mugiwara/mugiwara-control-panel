from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Mapping

from .domain import HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS
from .registry import HealthcheckSourceRegistry, HealthcheckSourceSnapshot

VAULT_SYNC_STATUS_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/vault-sync-status.json')
BACKUP_HEALTH_STATUS_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/backup-health-status.json')


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


def _parse_timestamp(value: str) -> datetime:
    normalized = value.replace('Z', '+00:00') if value.endswith('Z') else value
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed

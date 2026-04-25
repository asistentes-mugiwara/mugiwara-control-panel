from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from .domain import (
    HEALTHCHECK_SOURCE_LABELS,
    HealthcheckRecord,
    resolve_healthcheck_check_id,
    validate_healthcheck_freshness_state,
    validate_healthcheck_severity,
    validate_healthcheck_status,
)

_ALLOWED_SOURCE_FIELDS = frozenset(
    {
        'label',
        'status',
        'severity',
        'updated_at',
        'summary',
        'warning_text',
        'source_label',
        'freshness_label',
        'freshness_state',
    }
)

_SENSITIVE_TEXT_MARKERS = frozenset(
    {
        '/srv/',
        '/home/',
        '.env',
        'token',
        'secret',
        'password',
        'credential',
        'cookie',
        'raw_output',
        'stdout',
        'stderr',
        'command',
        'traceback',
        'journal',
        'unit_content',
        'backup_path',
        'included_path',
        'prompt_body',
        'chat_id',
        'delivery_target',
        'authorization',
        'private_key',
        'git_diff',
        'untracked_files',
        'remote_url',
    }
)

_SANITIZED_TEXT_DEFAULTS = {
    'summary': 'Resumen Healthcheck saneado por política de seguridad.',
    'warning_text': 'Detalle Healthcheck omitido por política de seguridad.',
    'source_label': 'Healthcheck source registry',
    'freshness_label': 'Frescura desconocida',
}


@dataclass(frozen=True)
class HealthcheckSourceSnapshot:
    record: HealthcheckRecord
    freshness_state: str


class HealthcheckSourceRegistry:
    """Backend-owned normalizer for future Healthcheck adapter records.

    The registry only accepts stable source IDs from the Healthcheck allowlist and
    copies a minimal field allowlist into the public read model. Unknown adapter
    fields are intentionally ignored here so raw host values cannot reach API
    serialization by accident.
    """

    def normalize(self, source_id: str, raw: Mapping[str, object] | None) -> HealthcheckSourceSnapshot:
        self._validate_source_id(source_id)
        if raw is None:
            return self.normalize_absent(source_id)

        allowed = {key: raw[key] for key in _ALLOWED_SOURCE_FIELDS if key in raw}
        record = HealthcheckRecord(
            module_id=source_id,
            label=self._string_field(allowed, 'label', HEALTHCHECK_SOURCE_LABELS[source_id]),
            status=self._string_field(allowed, 'status', 'unknown'),
            severity=self._string_field(allowed, 'severity', 'unknown'),
            updated_at=self._string_field(allowed, 'updated_at', ''),
            summary=self._safe_text_field(allowed, 'summary', 'Estado disponible con resumen saneado.'),
            warning_text=self._safe_text_field(allowed, 'warning_text', 'Estado degradado pendiente de revisión.'),
            source_label=self._safe_text_field(allowed, 'source_label', 'Healthcheck source registry'),
            freshness_label=self._safe_text_field(allowed, 'freshness_label', 'Frescura desconocida'),
        )
        validate_healthcheck_status(record.status)
        validate_healthcheck_severity(record.severity)
        freshness_state = self._string_field(allowed, 'freshness_state', 'unknown')
        validate_healthcheck_freshness_state(freshness_state)
        return HealthcheckSourceSnapshot(record=record, freshness_state=freshness_state)

    def normalize_absent(self, source_id: str) -> HealthcheckSourceSnapshot:
        return self._degraded_snapshot(
            source_id,
            status='not_configured',
            severity='unknown',
            summary='Fuente Healthcheck ausente o todavía no configurada.',
            warning_text='Fuente no configurada.',
            freshness_state='unknown',
        )

    def normalize_unreadable(self, source_id: str) -> HealthcheckSourceSnapshot:
        return self._degraded_snapshot(
            source_id,
            status='unknown',
            severity='unknown',
            summary='Fuente Healthcheck no legible; no se expone salida cruda.',
            warning_text='Fuente no legible.',
            freshness_state='unknown',
        )

    def normalize_unregistered(self, source_id: str) -> HealthcheckSourceSnapshot:
        return self._degraded_snapshot(
            source_id,
            status='not_configured',
            severity='unknown',
            summary='Fuente Healthcheck sin adaptador registrado.',
            warning_text='Adaptador no registrado.',
            freshness_state='unknown',
        )

    def _degraded_snapshot(
        self,
        source_id: str,
        *,
        status: str,
        severity: str,
        summary: str,
        warning_text: str,
        freshness_state: str,
    ) -> HealthcheckSourceSnapshot:
        self._validate_source_id(source_id)
        return HealthcheckSourceSnapshot(
            record=HealthcheckRecord(
                module_id=source_id,
                label=HEALTHCHECK_SOURCE_LABELS[source_id],
                status=status,
                severity=severity,
                updated_at='',
                summary=summary,
                warning_text=warning_text,
                source_label='Healthcheck source registry',
                freshness_label='Frescura desconocida',
            ),
            freshness_state=freshness_state,
        )

    def _validate_source_id(self, source_id: str) -> None:
        resolve_healthcheck_check_id(source_id)

    def _string_field(self, values: Mapping[str, object], key: str, default: str) -> str:
        value = values.get(key, default)
        if isinstance(value, str):
            return value
        return default

    def _safe_text_field(self, values: Mapping[str, object], key: str, default: str) -> str:
        value = self._string_field(values, key, default)
        if self._contains_sensitive_text(value):
            return _SANITIZED_TEXT_DEFAULTS.get(key, default)
        return value

    def _contains_sensitive_text(self, value: str) -> bool:
        normalized = value.lower()
        return any(marker in normalized for marker in _SENSITIVE_TEXT_MARKERS)

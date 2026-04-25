from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Mapping

HEALTHCHECK_STATUS_VALUES: tuple[str, ...] = ('pass', 'warn', 'fail', 'stale', 'not_configured', 'unknown')
HEALTHCHECK_SEVERITY_VALUES: tuple[str, ...] = ('low', 'medium', 'high', 'critical', 'unknown')
HEALTHCHECK_FRESHNESS_STATES: tuple[str, ...] = ('fresh', 'stale', 'unknown')

MUGIWARA_GATEWAY_SOURCE_IDS: tuple[str, ...] = (
    'gateway.luffy',
    'gateway.zoro',
    'gateway.nami',
    'gateway.usopp',
    'gateway.sanji',
    'gateway.chopper',
    'gateway.robin',
    'gateway.franky',
    'gateway.brook',
    'gateway.jinbe',
)

HEALTHCHECK_SOURCE_FAMILY_IDS: tuple[str, ...] = (
    'vault-sync',
    'project-health',
    'backup-health',
    'hermes-gateways',
    *MUGIWARA_GATEWAY_SOURCE_IDS,
    'cronjobs',
)

HEALTHCHECK_CHECK_ID_BY_SOURCE_ID: dict[str, str] = {
    'vault-sync': 'vault-sync.last-sync',
    'project-health': 'project-health.workspace',
    'backup-health': 'backup-health.last-backup',
    'hermes-gateways': 'hermes-gateways.global',
    **{source_id: f'{source_id}.process' for source_id in MUGIWARA_GATEWAY_SOURCE_IDS},
    'cronjobs': 'cronjobs.registry',
}

HEALTHCHECK_CHECK_IDS: tuple[str, ...] = tuple(HEALTHCHECK_CHECK_ID_BY_SOURCE_ID.values())

HEALTHCHECK_SOURCE_LABELS: Mapping[str, str] = MappingProxyType(
    {
        'vault-sync': 'Vault sync',
        'project-health': 'Project health',
        'backup-health': 'Backups',
        'hermes-gateways': 'Gateways',
        'gateway.luffy': 'Luffy gateway',
        'gateway.zoro': 'Zoro gateway',
        'gateway.nami': 'Nami gateway',
        'gateway.usopp': 'Usopp gateway',
        'gateway.sanji': 'Sanji gateway',
        'gateway.chopper': 'Chopper gateway',
        'gateway.robin': 'Robin gateway',
        'gateway.franky': 'Franky gateway',
        'gateway.brook': 'Brook gateway',
        'gateway.jinbe': 'Jinbe gateway',
        'cronjobs': 'Cronjobs',
    }
)


def validate_healthcheck_status(status: str) -> None:
    if status not in HEALTHCHECK_STATUS_VALUES:
        raise ValueError(f'Unsupported healthcheck status: {status}')


def validate_healthcheck_severity(severity: str) -> None:
    if severity not in HEALTHCHECK_SEVERITY_VALUES:
        raise ValueError(f'Unsupported healthcheck severity: {severity}')


def validate_healthcheck_freshness_state(state: str) -> None:
    if state not in HEALTHCHECK_FRESHNESS_STATES:
        raise ValueError(f'Unsupported healthcheck freshness state: {state}')


def resolve_healthcheck_check_id(source_id: str) -> str:
    try:
        return HEALTHCHECK_CHECK_ID_BY_SOURCE_ID[source_id]
    except KeyError as exc:
        raise ValueError('Unsupported healthcheck source id') from exc


@dataclass(frozen=True)
class HealthcheckFreshness:
    updated_at: str | None
    label: str
    state: str


@dataclass(frozen=True)
class HealthcheckRecord:
    module_id: str
    label: str
    status: str
    severity: str
    updated_at: str
    summary: str
    warning_text: str
    source_label: str
    freshness_label: str


@dataclass(frozen=True)
class HealthcheckSummaryBar:
    overall_status: str
    checks_total: int
    warnings: int
    incidents: int
    updated_at: str | None


@dataclass(frozen=True)
class HealthcheckModuleCard:
    module_id: str
    label: str
    status: str
    severity: str
    updated_at: str
    summary: str


@dataclass(frozen=True)
class HealthcheckEvent:
    event_id: str
    source: str
    status: str
    timestamp: str
    detail: str


@dataclass(frozen=True)
class HealthcheckSummaryItem:
    check_id: str
    label: str
    severity: str
    status: str
    freshness: HealthcheckFreshness
    warning_text: str
    source_label: str

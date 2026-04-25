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

_HEALTHCHECK_GATEWAY_FRESHNESS_THRESHOLD: Mapping[str, int] = MappingProxyType(
    {'warn_after_minutes': 15, 'fail_after_minutes': 60}
)

HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS: Mapping[str, Mapping[str, int]] = MappingProxyType(
    {
        'vault-sync': MappingProxyType({'warn_after_minutes': 90, 'fail_after_minutes': 360}),
        'project-health': MappingProxyType({'warn_after_minutes': 120, 'fail_after_minutes': 480}),
        'backup-health': MappingProxyType({'warn_after_minutes': 1800, 'fail_after_minutes': 4320}),
        'hermes-gateways': _HEALTHCHECK_GATEWAY_FRESHNESS_THRESHOLD,
        **{source_id: _HEALTHCHECK_GATEWAY_FRESHNESS_THRESHOLD for source_id in MUGIWARA_GATEWAY_SOURCE_IDS},
        'cronjobs': MappingProxyType({'warn_after_minutes': 180, 'fail_after_minutes': 720}),
    }
)

HEALTHCHECK_SOURCE_MANIFEST_POLICIES: Mapping[str, Mapping[str, str]] = MappingProxyType(
    {
        'vault-sync': MappingProxyType(
            {
                'owner': 'franky',
                'safe_location_class': 'franky-owned-vault-sync-status-manifest',
                'exclusions': 'raw logs, stdout, stderr, git diffs, credentials, absolute host paths',
            }
        ),
        'project-health': MappingProxyType(
            {
                'owner': 'zoro',
                'safe_location_class': 'repo-local-project-health-summary',
                'exclusions': 'untracked file lists, internal remotes, git diffs, absolute host paths, credentials',
            }
        ),
        'backup-health': MappingProxyType(
            {
                'owner': 'franky',
                'safe_location_class': 'franky-owned-backup-status-manifest',
                'exclusions': 'backup_path, included_path, raw logs, stdout, stderr, credentials, absolute host paths',
            }
        ),
        'hermes-gateways': MappingProxyType(
            {
                'owner': 'franky',
                'safe_location_class': 'systemd-user-gateway-status-summary',
                'exclusions': 'unit_content, journal, pid, command lines, stdout, stderr, environment values',
            }
        ),
        **{
            source_id: MappingProxyType(
                {
                    'owner': 'franky',
                    'safe_location_class': 'allowlisted-gateway-status-summary',
                    'exclusions': 'unit_content, journal, pid, command lines, stdout, stderr, environment values',
                }
            )
            for source_id in MUGIWARA_GATEWAY_SOURCE_IDS
        },
        'cronjobs': MappingProxyType(
            {
                'owner': 'franky',
                'safe_location_class': 'shared-manifest-registry',
                'exclusions': 'zoro profile-local cronjob list, prompt_body, chat_id, delivery targets, tokens, credentials',
            }
        ),
    }
)

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

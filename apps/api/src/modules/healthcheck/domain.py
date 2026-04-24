from __future__ import annotations

from dataclasses import dataclass


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

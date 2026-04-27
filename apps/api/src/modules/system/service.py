from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Protocol
import shutil

SYSTEM_METRICS_DISK_TARGET = '/'
SYSTEM_METRICS_DISK_TARGET_LABEL = 'fastapi-visible-root-filesystem'
SYSTEM_METRICS_SOURCE_LABEL = 'os-allowlisted-system-metrics'

SourceState = str


class DiskUsageSnapshot(Protocol):
    total: int
    used: int
    free: int


@dataclass(frozen=True)
class CapacityMetric:
    used_bytes: int | None
    total_bytes: int | None
    used_percent: float | None
    source_state: SourceState

    @classmethod
    def unknown(cls) -> 'CapacityMetric':
        return cls(used_bytes=None, total_bytes=None, used_percent=None, source_state='unknown')

    def to_public(self) -> dict:
        return {
            'used_bytes': self.used_bytes,
            'total_bytes': self.total_bytes,
            'used_percent': self.used_percent,
            'source_state': self.source_state,
        }


@dataclass(frozen=True)
class UptimeMetric:
    days: int | None
    hours: int | None
    minutes: int | None
    source_state: SourceState

    @classmethod
    def unknown(cls) -> 'UptimeMetric':
        return cls(days=None, hours=None, minutes=None, source_state='unknown')

    def to_public(self) -> dict:
        return {
            'days': self.days,
            'hours': self.hours,
            'minutes': self.minutes,
            'source_state': self.source_state,
        }


class SystemMetricsService:
    def __init__(
        self,
        *,
        meminfo_reader: Callable[[], str] | None = None,
        disk_usage_reader: Callable[[], DiskUsageSnapshot] | None = None,
        uptime_reader: Callable[[], str] | None = None,
        now: Callable[[], datetime] | None = None,
    ) -> None:
        self._meminfo_reader = meminfo_reader or self._read_proc_meminfo
        self._disk_usage_reader = disk_usage_reader or self._read_disk_usage
        self._uptime_reader = uptime_reader or self._read_proc_uptime
        self._now = now or (lambda: datetime.now(timezone.utc))

    def get_metrics(self) -> dict:
        ram = self._safe_ram_metric()
        disk = self._safe_disk_metric()
        uptime = self._safe_uptime_metric()
        source_state = 'live' if all(metric.source_state == 'live' for metric in (ram, disk, uptime)) else 'degraded'

        return {
            'ram': ram.to_public(),
            'disk': disk.to_public(),
            'uptime': uptime.to_public(),
            'updated_at': _format_updated_at(self._now()),
            'source_state': source_state,
        }

    def status_for(self, metrics: dict) -> str:
        if metrics.get('source_state') == 'live':
            return 'ready'
        return 'source_unavailable'

    def _safe_ram_metric(self) -> CapacityMetric:
        try:
            return _parse_meminfo(self._meminfo_reader())
        except Exception:
            return CapacityMetric.unknown()

    def _safe_disk_metric(self) -> CapacityMetric:
        try:
            usage = self._disk_usage_reader()
            return _capacity_metric(total_bytes=usage.total, used_bytes=usage.used)
        except Exception:
            return CapacityMetric.unknown()

    def _safe_uptime_metric(self) -> UptimeMetric:
        try:
            return _parse_uptime(self._uptime_reader())
        except Exception:
            return UptimeMetric.unknown()

    @staticmethod
    def _read_proc_meminfo() -> str:
        return Path('/proc/meminfo').read_text(encoding='utf-8')

    @staticmethod
    def _read_proc_uptime() -> str:
        return Path('/proc/uptime').read_text(encoding='utf-8')

    @staticmethod
    def _read_disk_usage() -> DiskUsageSnapshot:
        return shutil.disk_usage(SYSTEM_METRICS_DISK_TARGET)


def _parse_meminfo(content: str) -> CapacityMetric:
    values_kb: dict[str, int] = {}
    for line in content.splitlines():
        if ':' not in line:
            continue
        key, rest = line.split(':', 1)
        if key not in {'MemTotal', 'MemAvailable'}:
            continue
        parts = rest.strip().split()
        if not parts:
            raise ValueError('missing meminfo value')
        values_kb[key] = int(parts[0])

    total_kb = values_kb['MemTotal']
    available_kb = values_kb['MemAvailable']
    total_bytes = total_kb * 1024
    used_bytes = (total_kb - available_kb) * 1024
    return _capacity_metric(total_bytes=total_bytes, used_bytes=used_bytes)


def _capacity_metric(*, total_bytes: int, used_bytes: int) -> CapacityMetric:
    if total_bytes <= 0 or used_bytes < 0 or used_bytes > total_bytes:
        raise ValueError('invalid capacity metric')
    used_percent = round((used_bytes / total_bytes) * 100, 1)
    return CapacityMetric(
        used_bytes=used_bytes,
        total_bytes=total_bytes,
        used_percent=used_percent,
        source_state='live',
    )


def _parse_uptime(content: str) -> UptimeMetric:
    first_value = content.strip().split()[0]
    total_seconds = int(float(first_value))
    if total_seconds < 0:
        raise ValueError('invalid uptime')

    days, remainder = divmod(total_seconds, 86_400)
    hours, remainder = divmod(remainder, 3_600)
    minutes, _seconds = divmod(remainder, 60)
    return UptimeMetric(days=days, hours=hours, minutes=minutes, source_state='live')


def _format_updated_at(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    value = value.astimezone(timezone.utc).replace(microsecond=0)
    return value.isoformat().replace('+00:00', 'Z')

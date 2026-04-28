from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Literal
from zoneinfo import ZoneInfo
import os
import sqlite3

CODEX_USAGE_DB_PATH = Path('/srv/crew-core/runtime/usage/codex-usage.sqlite')
USAGE_REFRESH_INTERVAL_MINUTES = 15
USAGE_STALE_AFTER_MINUTES = 45
USAGE_CALENDAR_TIMEZONE = ZoneInfo('Europe/Madrid')
UsageCalendarRange = Literal['current_cycle', 'previous_cycle', '7d', '30d']
UsageActivityRange = Literal['current_cycle', 'previous_cycle', '7d', '30d']
MAX_USAGE_WINDOWS_LIMIT = 24
DEFAULT_USAGE_WINDOWS_LIMIT = 8
HERMES_PROFILES_ROOT_ENV = 'MUGIWARA_HERMES_PROFILES_ROOT'
HERMES_ACTIVITY_SOURCE_LABEL = 'hermes-profile-state-aggregate'
HERMES_ACTIVITY_PROFILES = ('luffy', 'zoro', 'nami', 'usopp', 'sanji', 'chopper', 'robin', 'franky', 'brook', 'jinbe')


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        normalized = value.replace('Z', '+00:00')
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _bool_or_none(value: Any) -> bool | None:
    if value is None:
        return None
    if value in (0, 1, False, True):
        return bool(value)
    return None


def _percent_or_none(value: Any) -> float | None:
    if value is None:
        return None
    try:
        percent = float(value)
    except (TypeError, ValueError):
        return None
    return max(0.0, min(100.0, round(percent, 2)))


def _window_status(percent: float | None, *, limit_reached: bool | None = None) -> str:
    if limit_reached:
        return 'limit_reached'
    if percent is None:
        return 'unknown'
    if percent >= 95:
        return 'critical'
    if percent >= 80:
        return 'high'
    return 'normal'


def _isoformat_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def _window_bucket_timestamp(value: str) -> str:
    parsed = _parse_datetime(value)
    if parsed is None:
        return value
    normalized = parsed.astimezone(timezone.utc).replace(second=0, microsecond=0)
    return normalized.isoformat()


def _local_midnight(value: datetime) -> datetime:
    local = value.astimezone(USAGE_CALENDAR_TIMEZONE)
    return datetime.combine(local.date(), time.min, tzinfo=USAGE_CALENDAR_TIMEZONE)


def _calendar_status(peak_primary: float | None, secondary_delta: float | None) -> str:
    if peak_primary is None and secondary_delta is None:
        return 'unknown'
    if peak_primary is not None and peak_primary >= 95:
        return 'critical'
    if peak_primary is not None and peak_primary >= 80:
        return 'high'
    if secondary_delta is not None and secondary_delta >= 25:
        return 'high'
    return 'normal'


def _positive_delta(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0 if len(values) == 1 else 0.0
    total = 0.0
    previous = values[0]
    for value in values[1:]:
        if value >= previous:
            total += value - previous
        previous = value
    return round(total, 2)


@dataclass(frozen=True)
class UsageSnapshot:
    captured_at: str
    plan_type: str | None
    allowed: bool | None
    limit_reached: bool | None
    primary_used_percent: float | None
    primary_window_seconds: int | None
    primary_window_start_at: str | None
    primary_reset_at: str | None
    primary_reset_after_seconds: int | None
    secondary_used_percent: float | None
    secondary_window_seconds: int | None
    secondary_cycle_start_at: str | None
    secondary_reset_at: str | None
    secondary_reset_after_seconds: int | None
    additional_limits_count: int


class UsageService:
    def __init__(self, *, db_path: Path = CODEX_USAGE_DB_PATH, hermes_profiles_root: Path | None = None, now: Callable[[], str] = _iso_now):
        self.db_path = db_path
        configured_profiles_root = os.environ.get(HERMES_PROFILES_ROOT_ENV)
        self.hermes_profiles_root = hermes_profiles_root if hermes_profiles_root is not None else (Path(configured_profiles_root) if configured_profiles_root else None)
        self._now = now

    def current_status(self) -> str:
        return self.status_for(self.get_current())

    @staticmethod
    def status_for(payload: dict[str, Any]) -> str:
        freshness_state = payload['current_snapshot']['freshness']['state']
        if payload['current_snapshot']['captured_at'] is None:
            return 'not_configured'
        if freshness_state == 'stale':
            return 'stale'
        return 'ready'

    def get_current(self) -> dict[str, Any]:
        snapshot = self._load_latest_snapshot()
        if snapshot is None:
            return self._empty_current()

        freshness = self._freshness(snapshot.captured_at)
        primary_status = _window_status(snapshot.primary_used_percent, limit_reached=snapshot.limit_reached)
        secondary_status = _window_status(snapshot.secondary_used_percent, limit_reached=snapshot.limit_reached)
        recommendation = self._recommendation(
            freshness_state=freshness['state'],
            limit_reached=snapshot.limit_reached,
            primary_status=primary_status,
            secondary_status=secondary_status,
        )

        return {
            'current_snapshot': {
                'captured_at': snapshot.captured_at,
                'source_label': 'snapshot cada 15 min',
                'freshness': freshness,
            },
            'plan': {
                'type': snapshot.plan_type or 'desconocido',
                'allowed': snapshot.allowed,
                'limit_reached': snapshot.limit_reached,
                'additional_limits_count': snapshot.additional_limits_count,
            },
            'primary_window': {
                'label': 'Ventana 5h',
                'used_percent': snapshot.primary_used_percent,
                'window_seconds': snapshot.primary_window_seconds,
                'started_at': snapshot.primary_window_start_at,
                'reset_at': snapshot.primary_reset_at,
                'reset_after_seconds': snapshot.primary_reset_after_seconds,
                'status': primary_status,
            },
            'secondary_cycle': {
                'label': 'Ciclo semanal Codex',
                'used_percent': snapshot.secondary_used_percent,
                'window_seconds': snapshot.secondary_window_seconds,
                'started_at': snapshot.secondary_cycle_start_at,
                'reset_at': snapshot.secondary_reset_at,
                'reset_after_seconds': snapshot.secondary_reset_after_seconds,
                'status': secondary_status,
            },
            'recommendation': recommendation,
            'methodology': {
                'cycle_copy': 'Codex no cuenta semanas de lunes a domingo: el ciclo semanal Codex va desde el reset anterior hasta el próximo reset.',
                'primary_window_formula': 'primary_reset_at - 18000s → primary_reset_at',
                'secondary_cycle_formula': 'secondary_reset_at - 604800s → secondary_reset_at',
                'privacy': 'Lectura agregada y saneada: sin email, user_id, account_id, tokens, headers, prompts ni raw payload.',
            },
        }

    def get_calendar(self, range_name: UsageCalendarRange) -> dict[str, Any]:
        latest = self._load_latest_snapshot()
        if latest is None:
            return {
                'range': range_name,
                'timezone': 'Europe/Madrid',
                'current_cycle': None,
                'days': [],
                'empty_reason': 'not_configured',
            }

        latest_captured = _parse_datetime(latest.captured_at)
        cycle_start = _parse_datetime(latest.secondary_cycle_start_at)
        cycle_reset = _parse_datetime(latest.secondary_reset_at)
        if latest_captured is None:
            return {
                'range': range_name,
                'timezone': 'Europe/Madrid',
                'current_cycle': None,
                'days': [],
                'empty_reason': 'unknown',
            }

        start_at, end_at = self._calendar_window(range_name, latest_captured, cycle_start, cycle_reset)
        snapshots = self._load_snapshots_between(start_at, end_at)
        return {
            'range': range_name,
            'timezone': 'Europe/Madrid',
            'current_cycle': {
                'started_at': latest.secondary_cycle_start_at,
                'reset_at': latest.secondary_reset_at,
                'label': 'Ciclo semanal Codex',
            },
            'days': self._calendar_days(snapshots, start_at=start_at, end_at=end_at, cycle_start=cycle_start, cycle_reset=cycle_reset),
        }

    def get_five_hour_windows(self, limit: int = DEFAULT_USAGE_WINDOWS_LIMIT) -> dict[str, Any]:
        safe_limit = max(1, min(MAX_USAGE_WINDOWS_LIMIT, limit))
        snapshots = self._load_latest_snapshots(limit=safe_limit * 96)
        if not snapshots:
            return {'windows': [], 'empty_reason': 'not_configured'}

        grouped: dict[tuple[str, str], list[UsageSnapshot]] = {}
        for snapshot in snapshots:
            if snapshot.primary_window_start_at is None or snapshot.primary_reset_at is None:
                continue
            started_at = _window_bucket_timestamp(snapshot.primary_window_start_at)
            ended_at = _window_bucket_timestamp(snapshot.primary_reset_at)
            grouped.setdefault((started_at, ended_at), []).append(snapshot)

        windows: list[dict[str, Any]] = []
        for (started_at, ended_at), window_snapshots in grouped.items():
            ordered = sorted(window_snapshots, key=lambda item: item.captured_at)
            values = [value for value in (item.primary_used_percent for item in ordered) if value is not None]
            peak = round(max(values), 2) if values else None
            delta = _positive_delta(values) if values else None
            windows.append(
                {
                    'started_at': started_at,
                    'ended_at': ended_at,
                    'peak_used_percent': peak,
                    'delta_percent': delta,
                    'samples_count': len(ordered),
                    'status': _window_status(peak),
                }
            )

        windows.sort(key=lambda item: item['started_at'], reverse=True)
        windows = windows[:safe_limit]
        return {'windows': windows, 'empty_reason': None if windows else 'not_configured'}

    @staticmethod
    def five_hour_windows_status_for(payload: dict[str, Any]) -> str:
        if payload.get('empty_reason') == 'not_configured':
            return 'not_configured'
        if not payload.get('windows'):
            return 'not_configured'
        return 'ready'

    def get_hermes_activity(self, range_name: UsageActivityRange) -> dict[str, Any]:
        start_at, end_at, range_empty_reason = self._activity_window(range_name)
        if self.hermes_profiles_root is None or not self.hermes_profiles_root.exists() or not self.hermes_profiles_root.is_dir():
            return self._empty_hermes_activity(range_name, start_at=start_at, end_at=end_at, empty_reason='not_configured')
        if range_empty_reason is not None:
            return self._empty_hermes_activity(range_name, start_at=start_at, end_at=end_at, empty_reason=range_empty_reason)

        profiles = []
        for profile in HERMES_ACTIVITY_PROFILES:
            state_db = self.hermes_profiles_root / profile / 'state.db'
            profile_summary = self._load_hermes_profile_activity(profile=profile, state_db=state_db, start_at=start_at, end_at=end_at)
            if profile_summary is not None and profile_summary['sessions_count'] > 0:
                profiles.append(profile_summary)

        profiles.sort(key=lambda item: (-item['messages_count'], -item['tool_calls_count'], item['profile']))
        totals = self._activity_totals(profiles)
        return {
            'range': {
                'name': range_name,
                'started_at': _isoformat_utc(start_at),
                'ended_at': _isoformat_utc(end_at),
            },
            'totals': totals,
            'profiles': profiles,
            'privacy': {
                'mode': 'read_only_aggregated',
                'correlation': 'orientativa',
                'exclusions': [
                    'prompts_crudos',
                    'conversaciones',
                    'payloads_herramientas',
                    'tokens_por_sesion',
                    'identificadores_usuario',
                    'identificadores_chat',
                    'destinos_entrega',
                    'secretos',
                    'cabeceras',
                    'galletas_http',
                    'logs_crudos',
                ],
            },
            'empty_reason': None if totals['sessions_count'] > 0 else 'no_activity',
        }

    @staticmethod
    def hermes_activity_status_for(payload: dict[str, Any]) -> str:
        if payload.get('empty_reason') == 'not_configured':
            return 'not_configured'
        if payload.get('empty_reason') == 'unknown':
            return 'unknown'
        if payload.get('empty_reason') == 'no_activity':
            return 'empty'
        if payload.get('totals', {}).get('sessions_count', 0) <= 0:
            return 'empty'
        return 'ready'

    @staticmethod
    def calendar_status_for(payload: dict[str, Any]) -> str:
        if payload.get('empty_reason') == 'not_configured':
            return 'not_configured'
        if payload.get('empty_reason') == 'unknown':
            return 'unknown'
        if len(payload.get('days', [])) == 0:
            return 'not_configured'
        return 'ready'

    def _empty_current(self) -> dict[str, Any]:
        return {
            'current_snapshot': {
                'captured_at': None,
                'source_label': 'snapshot cada 15 min',
                'freshness': {'state': 'unknown', 'age_minutes': None, 'label': 'Sin snapshot disponible'},
            },
            'plan': {'type': 'desconocido', 'allowed': None, 'limit_reached': None, 'additional_limits_count': 0},
            'primary_window': {
                'label': 'Ventana 5h',
                'used_percent': None,
                'window_seconds': 18000,
                'started_at': None,
                'reset_at': None,
                'reset_after_seconds': None,
                'status': 'unknown',
            },
            'secondary_cycle': {
                'label': 'Ciclo semanal Codex',
                'used_percent': None,
                'window_seconds': 604800,
                'started_at': None,
                'reset_at': None,
                'reset_after_seconds': None,
                'status': 'unknown',
            },
            'recommendation': {
                'state': 'sin_datos',
                'label': 'Sin datos',
                'message': 'Aún no hay snapshot saneado suficiente para mostrar tendencia de uso.',
            },
            'methodology': {
                'cycle_copy': 'Codex no cuenta semanas de lunes a domingo: el ciclo semanal Codex va desde el reset anterior hasta el próximo reset.',
                'primary_window_formula': 'primary_reset_at - 18000s → primary_reset_at',
                'secondary_cycle_formula': 'secondary_reset_at - 604800s → secondary_reset_at',
                'privacy': 'Lectura agregada y saneada: sin email, user_id, account_id, tokens, headers, prompts ni raw payload.',
            },
        }

    def _freshness(self, captured_at: str) -> dict[str, Any]:
        captured = _parse_datetime(captured_at)
        now = _parse_datetime(self._now())
        if captured is None or now is None:
            return {'state': 'unknown', 'age_minutes': None, 'label': 'Frescura desconocida'}
        age_minutes = max(0, int((now - captured).total_seconds() // 60))
        if age_minutes > USAGE_STALE_AFTER_MINUTES:
            return {'state': 'stale', 'age_minutes': age_minutes, 'label': 'Datos antiguos'}
        return {'state': 'fresh', 'age_minutes': age_minutes, 'label': 'Snapshot reciente'}

    def _recommendation(self, *, freshness_state: str, limit_reached: bool | None, primary_status: str, secondary_status: str) -> dict[str, str]:
        if freshness_state == 'stale':
            return {'state': 'datos_antiguos', 'label': 'Datos antiguos', 'message': 'El snapshot no es reciente. Revisa el timer o espera al próximo refresco.'}
        if limit_reached:
            return {'state': 'limite_alcanzado', 'label': 'Límite alcanzado', 'message': 'Espera al reset y evita reintentos automáticos.'}
        if 'critical' in (primary_status, secondary_status):
            return {'state': 'critico', 'label': 'Crítico', 'message': 'Margen reducido. Reserva Codex para tareas críticas o espera al reset.'}
        if 'high' in (primary_status, secondary_status):
            return {'state': 'alto', 'label': 'Alto', 'message': 'Conviene vigilar. Prioriza tareas importantes y evita exploraciones largas.'}
        return {'state': 'normal', 'label': 'Normal', 'message': 'Uso dentro de rango. Ritmo sano.'}

    def _calendar_window(
        self,
        range_name: UsageCalendarRange,
        latest_captured: datetime,
        cycle_start: datetime | None,
        cycle_reset: datetime | None,
    ) -> tuple[datetime, datetime]:
        if range_name == 'current_cycle' and cycle_start is not None and cycle_reset is not None:
            return cycle_start, min(latest_captured, cycle_reset)
        if range_name == 'previous_cycle' and cycle_start is not None and cycle_reset is not None:
            cycle_length = cycle_reset - cycle_start
            return cycle_start - cycle_length, cycle_start
        days = 30 if range_name == '30d' else 7
        end_at = latest_captured
        start_at = _local_midnight(latest_captured) - timedelta(days=days - 1)
        return start_at.astimezone(timezone.utc), end_at

    def _calendar_days(
        self,
        snapshots: list[UsageSnapshot],
        *,
        start_at: datetime,
        end_at: datetime,
        cycle_start: datetime | None,
        cycle_reset: datetime | None,
    ) -> list[dict[str, Any]]:
        grouped: dict[str, list[UsageSnapshot]] = {}
        for snapshot in snapshots:
            captured = _parse_datetime(snapshot.captured_at)
            if captured is None:
                continue
            date_key = captured.astimezone(USAGE_CALENDAR_TIMEZONE).date().isoformat()
            grouped.setdefault(date_key, []).append(snapshot)

        days: list[dict[str, Any]] = []
        for date_key in sorted(grouped):
            day_snapshots = sorted(grouped[date_key], key=lambda item: item.captured_at)
            local_day = datetime.fromisoformat(date_key).date()
            day_start = datetime.combine(local_day, time.min, tzinfo=USAGE_CALENDAR_TIMEZONE)
            day_end = day_start + timedelta(days=1)
            segment_start = max(day_start, start_at.astimezone(USAGE_CALENDAR_TIMEZONE))
            segment_end = min(day_end, end_at.astimezone(USAGE_CALENDAR_TIMEZONE))
            reason = None
            if cycle_start is not None and cycle_start.astimezone(USAGE_CALENDAR_TIMEZONE).date() == local_day:
                reason = 'cycle_started_today'
            elif cycle_reset is not None and cycle_reset.astimezone(USAGE_CALENDAR_TIMEZONE).date() == local_day:
                reason = 'cycle_resets_today'

            secondary_values_by_cycle: dict[tuple[str | None, str | None], list[float]] = {}
            for snapshot in day_snapshots:
                if snapshot.secondary_used_percent is None:
                    continue
                cycle_key = (snapshot.secondary_cycle_start_at, snapshot.secondary_reset_at)
                secondary_values_by_cycle.setdefault(cycle_key, []).append(snapshot.secondary_used_percent)
            secondary_delta = round(sum(_positive_delta(values) for values in secondary_values_by_cycle.values()), 2) if secondary_values_by_cycle else None
            primary_values = [value for value in (snapshot.primary_used_percent for snapshot in day_snapshots) if value is not None]
            peak_primary = round(max(primary_values), 2) if primary_values else None
            primary_windows = {
                snapshot.primary_window_start_at
                for snapshot in day_snapshots
                if snapshot.primary_window_start_at is not None
            }

            days.append(
                {
                    'date': date_key,
                    'codex_segment': {
                        'started_at': _isoformat_utc(segment_start),
                        'ended_at': _isoformat_utc(segment_end),
                        'partial': reason is not None,
                        'reason': reason,
                    },
                    'secondary_delta_percent': secondary_delta,
                    'primary_windows_count': len(primary_windows),
                    'peak_primary_used_percent': peak_primary,
                    'status': _calendar_status(peak_primary, secondary_delta),
                }
            )
        return days

    def _activity_window(self, range_name: UsageActivityRange) -> tuple[datetime, datetime, str | None]:
        now = _parse_datetime(self._now()) or datetime.now(timezone.utc)
        latest = self._load_latest_snapshot()
        cycle_start = _parse_datetime(latest.secondary_cycle_start_at) if latest is not None else None
        cycle_reset = _parse_datetime(latest.secondary_reset_at) if latest is not None else None
        if range_name == 'current_cycle':
            if cycle_start is None or cycle_reset is None:
                return now, now, 'not_configured'
            return cycle_start, min(now, cycle_reset), None
        if range_name == 'previous_cycle':
            if cycle_start is None or cycle_reset is None:
                return now, now, 'not_configured'
            cycle_length = cycle_reset - cycle_start
            return cycle_start - cycle_length, cycle_start, None
        days = 30 if range_name == '30d' else 7
        return now - timedelta(days=days), now, None

    def _empty_hermes_activity(self, range_name: UsageActivityRange, *, start_at: datetime, end_at: datetime, empty_reason: str) -> dict[str, Any]:
        return {
            'range': {
                'name': range_name,
                'started_at': _isoformat_utc(start_at),
                'ended_at': _isoformat_utc(end_at),
            },
            'totals': {
                'profiles_count': 0,
                'sessions_count': 0,
                'messages_count': 0,
                'tool_calls_count': 0,
                'dominant_profile': None,
            },
            'profiles': [],
            'privacy': {
                'mode': 'read_only_aggregated',
                'correlation': 'orientativa',
                'exclusions': [
                    'prompts_crudos',
                    'conversaciones',
                    'payloads_herramientas',
                    'tokens_por_sesion',
                    'identificadores_usuario',
                    'identificadores_chat',
                    'destinos_entrega',
                    'secretos',
                    'cabeceras',
                    'galletas_http',
                    'logs_crudos',
                ],
            },
            'empty_reason': empty_reason,
        }

    @staticmethod
    def _activity_level(messages_count: int, tool_calls_count: int) -> str:
        score = messages_count + (tool_calls_count * 2)
        if score >= 40:
            return 'high'
        if score >= 10:
            return 'medium'
        return 'low'

    @staticmethod
    def _activity_totals(profiles: list[dict[str, Any]]) -> dict[str, Any]:
        sessions_count = sum(int(profile['sessions_count']) for profile in profiles)
        messages_count = sum(int(profile['messages_count']) for profile in profiles)
        tool_calls_count = sum(int(profile['tool_calls_count']) for profile in profiles)
        dominant_profile = profiles[0]['profile'] if profiles else None
        return {
            'profiles_count': len(profiles),
            'sessions_count': sessions_count,
            'messages_count': messages_count,
            'tool_calls_count': tool_calls_count,
            'dominant_profile': dominant_profile,
        }

    def _load_hermes_profile_activity(self, *, profile: str, state_db: Path, start_at: datetime, end_at: datetime) -> dict[str, Any] | None:
        if not state_db.exists() or not state_db.is_file():
            return None
        try:
            con = sqlite3.connect(f'file:{state_db}?mode=ro', uri=True)
            con.row_factory = sqlite3.Row
            row = con.execute(
                """
                SELECT
                    COUNT(*) AS sessions_count,
                    COALESCE(SUM(message_count), 0) AS messages_count,
                    COALESCE(SUM(tool_call_count), 0) AS tool_calls_count,
                    MIN(started_at) AS first_activity_epoch,
                    MAX(started_at) AS last_activity_epoch
                FROM sessions
                WHERE started_at >= ? AND started_at <= ?
                """,
                (start_at.timestamp(), end_at.timestamp()),
            ).fetchone()
        except sqlite3.Error:
            return None
        finally:
            try:
                con.close()
            except UnboundLocalError:
                pass
        if row is None or int(row['sessions_count'] or 0) <= 0:
            return None
        sessions_count = int(row['sessions_count'] or 0)
        messages_count = int(row['messages_count'] or 0)
        tool_calls_count = int(row['tool_calls_count'] or 0)
        first_epoch = float(row['first_activity_epoch'])
        last_epoch = float(row['last_activity_epoch'])
        return {
            'profile': profile,
            'sessions_count': sessions_count,
            'messages_count': messages_count,
            'tool_calls_count': tool_calls_count,
            'first_activity_at': datetime.fromtimestamp(first_epoch, timezone.utc).isoformat(),
            'last_activity_at': datetime.fromtimestamp(last_epoch, timezone.utc).isoformat(),
            'activity_level': self._activity_level(messages_count, tool_calls_count),
        }

    def _load_latest_snapshot(self) -> UsageSnapshot | None:
        if not self.db_path.exists() or not self.db_path.is_file():
            return None
        try:
            con = sqlite3.connect(f'file:{self.db_path}?mode=ro', uri=True)
            con.row_factory = sqlite3.Row
            row = con.execute(
                """
                SELECT
                    captured_at,
                    plan_type,
                    allowed,
                    limit_reached,
                    primary_used_percent,
                    primary_window_seconds,
                    primary_window_start_at,
                    primary_reset_at,
                    primary_reset_after_seconds,
                    secondary_used_percent,
                    secondary_window_seconds,
                    secondary_cycle_start_at,
                    secondary_reset_at,
                    secondary_reset_after_seconds,
                    additional_limits_count
                FROM codex_usage_snapshots
                ORDER BY captured_at_epoch DESC, id DESC
                LIMIT 1
                """
            ).fetchone()
        except sqlite3.Error:
            return None
        finally:
            try:
                con.close()
            except UnboundLocalError:
                pass

        if row is None:
            return None
        return self._snapshot_from_row(row)

    def _load_latest_snapshots(self, *, limit: int) -> list[UsageSnapshot]:
        if not self.db_path.exists() or not self.db_path.is_file():
            return []
        try:
            con = sqlite3.connect(f'file:{self.db_path}?mode=ro', uri=True)
            con.row_factory = sqlite3.Row
            rows = con.execute(
                """
                SELECT
                    captured_at,
                    plan_type,
                    allowed,
                    limit_reached,
                    primary_used_percent,
                    primary_window_seconds,
                    primary_window_start_at,
                    primary_reset_at,
                    primary_reset_after_seconds,
                    secondary_used_percent,
                    secondary_window_seconds,
                    secondary_cycle_start_at,
                    secondary_reset_at,
                    secondary_reset_after_seconds,
                    additional_limits_count
                FROM codex_usage_snapshots
                ORDER BY captured_at_epoch DESC, id DESC
                LIMIT ?
                """,
                (max(1, min(MAX_USAGE_WINDOWS_LIMIT * 96, limit)),),
            ).fetchall()
        except sqlite3.Error:
            return []
        finally:
            try:
                con.close()
            except UnboundLocalError:
                pass
        snapshots = [self._snapshot_from_row(row) for row in rows]
        return sorted(snapshots, key=lambda item: item.captured_at)

    def _load_snapshots_between(self, start_at: datetime, end_at: datetime) -> list[UsageSnapshot]:
        if not self.db_path.exists() or not self.db_path.is_file():
            return []
        try:
            con = sqlite3.connect(f'file:{self.db_path}?mode=ro', uri=True)
            con.row_factory = sqlite3.Row
            rows = con.execute(
                """
                SELECT
                    captured_at,
                    plan_type,
                    allowed,
                    limit_reached,
                    primary_used_percent,
                    primary_window_seconds,
                    primary_window_start_at,
                    primary_reset_at,
                    primary_reset_after_seconds,
                    secondary_used_percent,
                    secondary_window_seconds,
                    secondary_cycle_start_at,
                    secondary_reset_at,
                    secondary_reset_after_seconds,
                    additional_limits_count
                FROM codex_usage_snapshots
                WHERE captured_at_epoch >= ? AND captured_at_epoch <= ?
                ORDER BY captured_at_epoch ASC, id ASC
                """,
                (int(start_at.timestamp()), int(end_at.timestamp())),
            ).fetchall()
        except sqlite3.Error:
            return []
        finally:
            try:
                con.close()
            except UnboundLocalError:
                pass
        return [self._snapshot_from_row(row) for row in rows]

    @staticmethod
    def _snapshot_from_row(row: sqlite3.Row) -> UsageSnapshot:
        return UsageSnapshot(
            captured_at=str(row['captured_at']),
            plan_type=row['plan_type'],
            allowed=_bool_or_none(row['allowed']),
            limit_reached=_bool_or_none(row['limit_reached']),
            primary_used_percent=_percent_or_none(row['primary_used_percent']),
            primary_window_seconds=row['primary_window_seconds'],
            primary_window_start_at=row['primary_window_start_at'],
            primary_reset_at=row['primary_reset_at'],
            primary_reset_after_seconds=row['primary_reset_after_seconds'],
            secondary_used_percent=_percent_or_none(row['secondary_used_percent']),
            secondary_window_seconds=row['secondary_window_seconds'],
            secondary_cycle_start_at=row['secondary_cycle_start_at'],
            secondary_reset_at=row['secondary_reset_at'],
            secondary_reset_after_seconds=row['secondary_reset_after_seconds'],
            additional_limits_count=int(row['additional_limits_count'] or 0),
        )

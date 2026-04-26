from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
import sqlite3

CODEX_USAGE_DB_PATH = Path('/srv/crew-core/runtime/usage/codex-usage.sqlite')
USAGE_REFRESH_INTERVAL_MINUTES = 15
USAGE_STALE_AFTER_MINUTES = 45


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
    def __init__(self, *, db_path: Path = CODEX_USAGE_DB_PATH, now: Callable[[], str] = _iso_now):
        self.db_path = db_path
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

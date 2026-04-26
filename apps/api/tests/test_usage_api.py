from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path

from fastapi.testclient import TestClient

from apps.api.src.main import app
from apps.api.src.modules.usage.router import get_usage_service
from apps.api.src.modules.usage.service import UsageService


def _create_usage_db(path: Path, *, captured_at: str = '2026-04-26T14:29:29+00:00') -> None:
    con = sqlite3.connect(path)
    _create_usage_schema(con)
    _insert_usage_snapshot(
        con,
        captured_at=captured_at,
        plan_type='prolite',
        allowed=1,
        limit_reached=0,
        primary_used_percent=26.0,
        primary_window_start_at='2026-04-26T10:04:43+00:00',
        primary_reset_at='2026-04-26T15:04:43+00:00',
        primary_reset_after_seconds=2114,
        secondary_used_percent=90.0,
        secondary_cycle_start_at='2026-04-21T18:25:51+00:00',
        secondary_reset_at='2026-04-28T18:25:51+00:00',
        secondary_reset_after_seconds=186982,
    )
    con.commit()
    con.close()


def _create_usage_schema(con: sqlite3.Connection) -> None:
    con.execute(
        """
        CREATE TABLE codex_usage_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            captured_at TEXT NOT NULL,
            captured_at_epoch INTEGER NOT NULL,
            plan_type TEXT,
            allowed INTEGER,
            limit_reached INTEGER,
            primary_used_percent REAL,
            primary_window_seconds INTEGER,
            primary_window_start_at TEXT,
            primary_reset_at TEXT,
            primary_reset_after_seconds INTEGER,
            secondary_used_percent REAL,
            secondary_window_seconds INTEGER,
            secondary_cycle_start_at TEXT,
            secondary_reset_at TEXT,
            secondary_reset_after_seconds INTEGER,
            additional_limits_count INTEGER NOT NULL DEFAULT 0,
            created_by TEXT NOT NULL DEFAULT 'franky',
            schema_version INTEGER NOT NULL DEFAULT 1
        )
        """
    )


def _insert_usage_snapshot(
    con: sqlite3.Connection,
    *,
    captured_at: str,
    plan_type: str = 'prolite',
    allowed: int = 1,
    limit_reached: int = 0,
    primary_used_percent: float = 0.0,
    primary_window_start_at: str,
    primary_reset_at: str,
    primary_reset_after_seconds: int = 0,
    secondary_used_percent: float,
    secondary_cycle_start_at: str,
    secondary_reset_at: str,
    secondary_reset_after_seconds: int = 0,
    additional_limits_count: int = 1,
) -> None:
    captured_epoch = int(datetime.fromisoformat(captured_at.replace('Z', '+00:00')).timestamp())
    con.execute(
        """
        INSERT INTO codex_usage_snapshots (
            captured_at,
            captured_at_epoch,
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
            additional_limits_count,
            created_by,
            schema_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            captured_at,
            captured_epoch,
            plan_type,
            allowed,
            limit_reached,
            primary_used_percent,
            18000,
            primary_window_start_at,
            primary_reset_at,
            primary_reset_after_seconds,
            secondary_used_percent,
            604800,
            secondary_cycle_start_at,
            secondary_reset_at,
            secondary_reset_after_seconds,
            additional_limits_count,
            'franky',
            1,
        ),
    )


def _override_usage_service(service: UsageService):
    app.dependency_overrides[get_usage_service] = lambda: service


def teardown_function():
    app.dependency_overrides.clear()


def test_usage_current_returns_sanitized_codex_snapshot(tmp_path):
    db_path = tmp_path / 'codex-usage.sqlite'
    _create_usage_db(db_path)
    _override_usage_service(UsageService(db_path=db_path, now=lambda: '2026-04-26T14:40:00+00:00'))

    response = TestClient(app).get('/api/v1/usage/current')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'usage.current'
    assert payload['status'] == 'ready'
    assert payload['meta'] == {
        'read_only': True,
        'sanitized': True,
        'source': 'codex-usage-snapshot-sqlite',
        'refresh_interval_minutes': 15,
    }

    data = payload['data']
    assert data['plan']['type'] == 'prolite'
    assert data['plan']['allowed'] is True
    assert data['plan']['limit_reached'] is False
    assert data['current_snapshot']['captured_at'] == '2026-04-26T14:29:29+00:00'
    assert data['current_snapshot']['source_label'] == 'snapshot cada 15 min'
    assert data['current_snapshot']['freshness']['state'] == 'fresh'
    assert data['primary_window'] == {
        'label': 'Ventana 5h',
        'used_percent': 26.0,
        'window_seconds': 18000,
        'started_at': '2026-04-26T10:04:43+00:00',
        'reset_at': '2026-04-26T15:04:43+00:00',
        'reset_after_seconds': 2114,
        'status': 'normal',
    }
    assert data['secondary_cycle'] == {
        'label': 'Ciclo semanal Codex',
        'used_percent': 90.0,
        'window_seconds': 604800,
        'started_at': '2026-04-21T18:25:51+00:00',
        'reset_at': '2026-04-28T18:25:51+00:00',
        'reset_after_seconds': 186982,
        'status': 'high',
    }
    assert data['recommendation']['state'] == 'alto'
    assert 'semana' not in data['secondary_cycle']['label'].lower().replace('semanal', '')
    assert '/srv/crew-core/runtime/usage' not in str(payload)
    assert 'synthetic-token' not in str(payload).lower()
    assert 'raw_payload_value' not in str(payload).lower()


def test_usage_current_degrades_when_snapshot_db_is_absent(tmp_path):
    _override_usage_service(UsageService(db_path=tmp_path / 'missing.sqlite', now=lambda: '2026-04-26T14:40:00+00:00'))

    response = TestClient(app).get('/api/v1/usage/current')

    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] == 'not_configured'
    assert payload['data']['current_snapshot']['freshness']['state'] == 'unknown'
    assert payload['data']['recommendation']['state'] == 'sin_datos'
    assert 'missing.sqlite' not in str(payload)


def test_usage_current_marks_old_snapshots_as_stale(tmp_path):
    db_path = tmp_path / 'codex-usage.sqlite'
    _create_usage_db(db_path, captured_at='2026-04-26T10:00:00+00:00')
    _override_usage_service(UsageService(db_path=db_path, now=lambda: '2026-04-26T14:40:00+00:00'))

    response = TestClient(app).get('/api/v1/usage/current')

    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] == 'stale'
    assert payload['data']['current_snapshot']['freshness']['state'] == 'stale'
    assert payload['data']['recommendation']['state'] == 'datos_antiguos'


def test_usage_calendar_current_cycle_groups_by_natural_date_and_marks_partial_segments(tmp_path):
    db_path = tmp_path / 'codex-usage.sqlite'
    con = sqlite3.connect(db_path)
    _create_usage_schema(con)
    # Cycle starts at 20:25 CEST, so the first natural date is a partial segment.
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-21T18:30:00+00:00',
        primary_used_percent=5.0,
        primary_window_start_at='2026-04-21T18:25:51+00:00',
        primary_reset_at='2026-04-21T23:25:51+00:00',
        secondary_used_percent=1.0,
        secondary_cycle_start_at='2026-04-21T18:25:51+00:00',
        secondary_reset_at='2026-04-28T18:25:51+00:00',
    )
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-21T21:00:00+00:00',
        primary_used_percent=25.0,
        primary_window_start_at='2026-04-21T18:25:51+00:00',
        primary_reset_at='2026-04-21T23:25:51+00:00',
        secondary_used_percent=4.0,
        secondary_cycle_start_at='2026-04-21T18:25:51+00:00',
        secondary_reset_at='2026-04-28T18:25:51+00:00',
    )
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-22T10:00:00+00:00',
        primary_used_percent=80.0,
        primary_window_start_at='2026-04-22T08:00:00+00:00',
        primary_reset_at='2026-04-22T13:00:00+00:00',
        secondary_used_percent=12.5,
        secondary_cycle_start_at='2026-04-21T18:25:51+00:00',
        secondary_reset_at='2026-04-28T18:25:51+00:00',
    )
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-22T16:00:00+00:00',
        primary_used_percent=30.0,
        primary_window_start_at='2026-04-22T13:00:00+00:00',
        primary_reset_at='2026-04-22T18:00:00+00:00',
        secondary_used_percent=15.0,
        secondary_cycle_start_at='2026-04-21T18:25:51+00:00',
        secondary_reset_at='2026-04-28T18:25:51+00:00',
    )
    con.commit()
    con.close()
    _override_usage_service(UsageService(db_path=db_path, now=lambda: '2026-04-22T16:30:00+00:00'))

    response = TestClient(app).get('/api/v1/usage/calendar?range=current_cycle')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'usage.calendar'
    assert payload['status'] == 'ready'
    assert payload['meta'] == {
        'read_only': True,
        'sanitized': True,
        'source': 'codex-usage-snapshot-sqlite',
        'range': 'current_cycle',
        'timezone': 'Europe/Madrid',
    }
    rows = payload['data']['days']
    assert [row['date'] for row in rows] == ['2026-04-21', '2026-04-22']
    assert rows[0]['codex_segment']['partial'] is True
    assert rows[0]['codex_segment']['reason'] == 'cycle_started_today'
    assert rows[0]['secondary_delta_percent'] == 3.0
    assert rows[0]['primary_windows_count'] == 1
    assert rows[0]['peak_primary_used_percent'] == 25.0
    assert rows[1]['codex_segment']['partial'] is False
    assert rows[1]['secondary_delta_percent'] == 2.5
    assert rows[1]['primary_windows_count'] == 2
    assert rows[1]['peak_primary_used_percent'] == 80.0
    assert rows[1]['status'] == 'high'
    assert '/srv/crew-core/runtime/usage' not in str(payload)
    assert 'raw_payload_value' not in str(payload)


def test_usage_calendar_rejects_unknown_ranges_without_echoing_sensitive_values(tmp_path):
    _override_usage_service(UsageService(db_path=tmp_path / 'missing.sqlite', now=lambda: '2026-04-26T14:40:00+00:00'))

    response = TestClient(app).get('/api/v1/usage/calendar?range=/srv/crew-core/runtime/usage/codex-usage.sqlite')

    assert response.status_code == 422
    payload = response.json()
    assert payload == {'detail': {'code': 'validation_error', 'message': 'Request validation failed.'}}
    assert '/srv/crew-core/runtime/usage' not in str(payload)

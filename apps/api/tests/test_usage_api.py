from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

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


def _epoch(value: str) -> float:
    return datetime.fromisoformat(value.replace('Z', '+00:00')).timestamp()


def _create_hermes_state_db(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(path)
    con.execute(
        """
        CREATE TABLE sessions (
            id TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            user_id TEXT,
            model TEXT,
            model_config TEXT,
            system_prompt TEXT,
            parent_session_id TEXT,
            started_at REAL NOT NULL,
            ended_at REAL,
            end_reason TEXT,
            message_count INTEGER DEFAULT 0,
            tool_call_count INTEGER DEFAULT 0,
            input_tokens INTEGER DEFAULT 0,
            output_tokens INTEGER DEFAULT 0,
            cache_read_tokens INTEGER DEFAULT 0,
            cache_write_tokens INTEGER DEFAULT 0,
            reasoning_tokens INTEGER DEFAULT 0,
            billing_provider TEXT,
            billing_base_url TEXT,
            billing_mode TEXT,
            estimated_cost_usd REAL,
            actual_cost_usd REAL,
            cost_status TEXT,
            cost_source TEXT,
            pricing_version TEXT,
            title TEXT,
            FOREIGN KEY (parent_session_id) REFERENCES sessions(id)
        )
        """
    )
    for row in rows:
        con.execute(
            """
            INSERT INTO sessions (
                id, source, user_id, model, model_config, system_prompt, parent_session_id,
                started_at, ended_at, end_reason, message_count, tool_call_count,
                input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
                reasoning_tokens, billing_provider, billing_base_url, billing_mode,
                estimated_cost_usd, actual_cost_usd, cost_status, cost_source,
                pricing_version, title
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                row['id'],
                row.get('source', 'telegram'),
                row.get('user_id', 'secret-user-123'),
                row.get('model', 'secret-model-name'),
                row.get('model_config', '{"api_key":"synthetic-token"}'),
                row.get('system_prompt', 'raw prompt body should never leak'),
                row.get('parent_session_id'),
                _epoch(row['started_at']),
                _epoch(row.get('ended_at', row['started_at'])),
                row.get('end_reason', 'stop'),
                row.get('message_count', 0),
                row.get('tool_call_count', 0),
                row.get('input_tokens', 999999),
                row.get('output_tokens', 999999),
                row.get('cache_read_tokens', 999999),
                row.get('cache_write_tokens', 999999),
                row.get('reasoning_tokens', 999999),
                row.get('billing_provider', 'secret-provider'),
                row.get('billing_base_url', 'https://token.example.invalid'),
                row.get('billing_mode', 'secret-mode'),
                row.get('estimated_cost_usd', 42.0),
                row.get('actual_cost_usd', 43.0),
                row.get('cost_status', 'secret-cost'),
                row.get('cost_source', 'secret-source'),
                row.get('pricing_version', 'secret-pricing'),
                row.get('title', 'conversation title should never leak'),
            ),
        )
    con.commit()
    con.close()


def _assert_no_usage_activity_leakage(payload: dict[str, Any]) -> None:
    serialized = str(payload).lower()
    forbidden = [
        'state.db',
        '/home/agentops',
        'secret-user-123',
        'synthetic-token',
        'raw prompt body',
        'conversation title',
        'secret-model-name',
        'token.example.invalid',
        '999999',
        '42.0',
        '43.0',
        'chat_id',
        'delivery',
        'cookie',
        'authorization',
    ]
    for marker in forbidden:
        assert marker not in serialized


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


def test_usage_five_hour_windows_groups_latest_windows_without_leaking_runtime_path(tmp_path):
    db_path = tmp_path / 'codex-usage.sqlite'
    con = sqlite3.connect(db_path)
    _create_usage_schema(con)
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-26T10:10:00+00:00',
        primary_used_percent=5.0,
        primary_window_start_at='2026-04-26T10:00:00+00:00',
        primary_reset_at='2026-04-26T15:00:00+00:00',
        secondary_used_percent=80.0,
        secondary_cycle_start_at='2026-04-21T18:25:51+00:00',
        secondary_reset_at='2026-04-28T18:25:51+00:00',
    )
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-26T12:00:00+00:00',
        primary_used_percent=35.0,
        primary_window_start_at='2026-04-26T10:00:00+00:00',
        primary_reset_at='2026-04-26T15:00:00+00:00',
        secondary_used_percent=82.0,
        secondary_cycle_start_at='2026-04-21T18:25:51+00:00',
        secondary_reset_at='2026-04-28T18:25:51+00:00',
    )
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-26T15:05:00+00:00',
        primary_used_percent=2.0,
        primary_window_start_at='2026-04-26T15:00:00+00:00',
        primary_reset_at='2026-04-26T20:00:00+00:00',
        secondary_used_percent=83.0,
        secondary_cycle_start_at='2026-04-21T18:25:51+00:00',
        secondary_reset_at='2026-04-28T18:25:51+00:00',
    )
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-26T19:00:00+00:00',
        primary_used_percent=97.0,
        primary_window_start_at='2026-04-26T15:00:00+00:00',
        primary_reset_at='2026-04-26T20:00:00+00:00',
        secondary_used_percent=90.0,
        secondary_cycle_start_at='2026-04-21T18:25:51+00:00',
        secondary_reset_at='2026-04-28T18:25:51+00:00',
    )
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-26T19:15:00+00:00',
        primary_used_percent=98.0,
        primary_window_start_at='2026-04-26T15:00:01+00:00',
        primary_reset_at='2026-04-26T20:00:01+00:00',
        secondary_used_percent=91.0,
        secondary_cycle_start_at='2026-04-21T18:25:51+00:00',
        secondary_reset_at='2026-04-28T18:25:51+00:00',
    )
    con.commit()
    con.close()
    _override_usage_service(UsageService(db_path=db_path, now=lambda: '2026-04-26T20:00:00+00:00'))

    response = TestClient(app).get('/api/v1/usage/five-hour-windows?limit=2')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'usage.five_hour_windows'
    assert payload['status'] == 'ready'
    assert payload['meta'] == {
        'read_only': True,
        'sanitized': True,
        'source': 'codex-usage-snapshot-sqlite',
        'limit': 2,
    }
    assert payload['data']['empty_reason'] is None
    windows = payload['data']['windows']
    assert [window['started_at'] for window in windows] == ['2026-04-26T15:00:00+00:00', '2026-04-26T10:00:00+00:00']
    assert windows[0] == {
        'started_at': '2026-04-26T15:00:00+00:00',
        'ended_at': '2026-04-26T20:00:00+00:00',
        'peak_used_percent': 98.0,
        'delta_percent': 96.0,
        'samples_count': 3,
        'status': 'critical',
    }
    assert windows[1]['peak_used_percent'] == 35.0
    assert windows[1]['delta_percent'] == 30.0
    assert '/srv/crew-core/runtime/usage' not in str(payload)
    assert 'raw_payload_value' not in str(payload)


def test_usage_five_hour_windows_degrades_when_snapshot_db_is_absent(tmp_path):
    _override_usage_service(UsageService(db_path=tmp_path / 'missing.sqlite', now=lambda: '2026-04-26T14:40:00+00:00'))

    response = TestClient(app).get('/api/v1/usage/five-hour-windows')

    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] == 'not_configured'
    assert payload['data'] == {'windows': [], 'empty_reason': 'not_configured'}
    assert 'missing.sqlite' not in str(payload)


def test_usage_five_hour_windows_rejects_invalid_limits_without_echoing_sensitive_values(tmp_path):
    _override_usage_service(UsageService(db_path=tmp_path / 'missing.sqlite', now=lambda: '2026-04-26T14:40:00+00:00'))

    for value in ('0', '25', '/srv/crew-core/runtime/usage/codex-usage.sqlite'):
        response = TestClient(app).get(f'/api/v1/usage/five-hour-windows?limit={value}')

        assert response.status_code == 422
        payload = response.json()
        assert payload == {'detail': {'code': 'validation_error', 'message': 'Request validation failed.'}}
        assert '/srv/crew-core/runtime/usage' not in str(payload)


def test_usage_hermes_activity_aggregates_profile_sessions_without_leaking_sensitive_state(tmp_path):
    profiles_root = tmp_path / 'profiles'
    _create_hermes_state_db(
        profiles_root / 'zoro' / 'state.db',
        [
            {'id': 'zoro-session-1', 'started_at': '2026-04-25T12:00:00+00:00', 'message_count': 8, 'tool_call_count': 3},
            {'id': 'zoro-session-2', 'started_at': '2026-04-26T09:00:00+00:00', 'message_count': 4, 'tool_call_count': 1},
            {'id': 'old-zoro-session', 'started_at': '2026-04-10T09:00:00+00:00', 'message_count': 50, 'tool_call_count': 50},
        ],
    )
    _create_hermes_state_db(
        profiles_root / 'franky' / 'state.db',
        [
            {'id': 'franky-session-1', 'started_at': '2026-04-24T10:00:00+00:00', 'message_count': 5, 'tool_call_count': 1},
        ],
    )
    _override_usage_service(UsageService(db_path=tmp_path / 'missing-codex.sqlite', hermes_profiles_root=profiles_root, now=lambda: '2026-04-27T10:00:00+00:00'))

    response = TestClient(app).get('/api/v1/usage/hermes-activity?range=7d')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'usage.hermes_activity'
    assert payload['status'] == 'ready'
    assert payload['meta'] == {
        'read_only': True,
        'sanitized': True,
        'source': 'hermes-profile-state-aggregate',
        'range': '7d',
    }
    assert payload['data']['range']['name'] == '7d'
    assert payload['data']['totals'] == {
        'profiles_count': 2,
        'sessions_count': 3,
        'messages_count': 17,
        'tool_calls_count': 5,
        'dominant_profile': 'zoro',
    }
    profiles = payload['data']['profiles']
    assert profiles[0] == {
        'profile': 'zoro',
        'sessions_count': 2,
        'messages_count': 12,
        'tool_calls_count': 4,
        'first_activity_at': '2026-04-25T12:00:00+00:00',
        'last_activity_at': '2026-04-26T09:00:00+00:00',
        'activity_level': 'medium',
    }
    assert profiles[1]['profile'] == 'franky'
    assert profiles[1]['activity_level'] == 'low'
    assert payload['data']['privacy']['correlation'] == 'orientativa'
    _assert_no_usage_activity_leakage(payload)


def test_usage_hermes_activity_degrades_when_profiles_root_is_not_configured(tmp_path):
    _override_usage_service(UsageService(db_path=tmp_path / 'missing-codex.sqlite', hermes_profiles_root=None, now=lambda: '2026-04-27T10:00:00+00:00'))

    response = TestClient(app).get('/api/v1/usage/hermes-activity?range=7d')

    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] == 'not_configured'
    assert payload['data']['profiles'] == []
    assert payload['data']['totals']['profiles_count'] == 0
    _assert_no_usage_activity_leakage(payload)


def test_usage_hermes_activity_rejects_unknown_ranges_without_echoing_sensitive_values(tmp_path):
    _override_usage_service(UsageService(db_path=tmp_path / 'missing.sqlite', hermes_profiles_root=tmp_path / 'profiles', now=lambda: '2026-04-27T10:00:00+00:00'))

    response = TestClient(app).get('/api/v1/usage/hermes-activity?range=/home/agentops/.hermes/profiles/zoro/state.db')

    assert response.status_code == 422
    payload = response.json()
    assert payload == {'detail': {'code': 'validation_error', 'message': 'Request validation failed.'}}
    assert '/home/agentops' not in str(payload)
    assert 'state.db' not in str(payload)


def test_usage_calendar_does_not_count_cycle_reset_as_daily_delta(tmp_path):
    db_path = tmp_path / 'codex-usage.sqlite'
    con = sqlite3.connect(db_path)
    _create_usage_schema(con)
    # Same Europe/Madrid natural date, but two different Codex cycles around reset.
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-26T17:30:00+00:00',
        primary_used_percent=40.0,
        primary_window_start_at='2026-04-26T13:00:00+00:00',
        primary_reset_at='2026-04-26T18:00:00+00:00',
        secondary_used_percent=98.0,
        secondary_cycle_start_at='2026-04-19T18:25:51+00:00',
        secondary_reset_at='2026-04-26T18:25:51+00:00',
    )
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-26T18:20:00+00:00',
        primary_used_percent=50.0,
        primary_window_start_at='2026-04-26T13:00:00+00:00',
        primary_reset_at='2026-04-26T18:25:51+00:00',
        secondary_used_percent=100.0,
        secondary_cycle_start_at='2026-04-19T18:25:51+00:00',
        secondary_reset_at='2026-04-26T18:25:51+00:00',
    )
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-26T18:30:00+00:00',
        plan_type='pro',
        primary_used_percent=0.0,
        primary_window_start_at='2026-04-26T18:25:51+00:00',
        primary_reset_at='2026-04-26T23:25:51+00:00',
        secondary_used_percent=0.0,
        secondary_cycle_start_at='2026-04-26T18:25:51+00:00',
        secondary_reset_at='2026-05-03T18:25:51+00:00',
    )
    _insert_usage_snapshot(
        con,
        captured_at='2026-04-26T19:30:00+00:00',
        plan_type='pro',
        primary_used_percent=1.0,
        primary_window_start_at='2026-04-26T18:25:51+00:00',
        primary_reset_at='2026-04-26T23:25:51+00:00',
        secondary_used_percent=2.0,
        secondary_cycle_start_at='2026-04-26T18:25:51+00:00',
        secondary_reset_at='2026-05-03T18:25:51+00:00',
    )
    con.commit()
    con.close()
    _override_usage_service(UsageService(db_path=db_path, now=lambda: '2026-04-26T20:00:00+00:00'))

    response = TestClient(app).get('/api/v1/usage/calendar?range=7d')

    assert response.status_code == 200
    rows = response.json()['data']['days']
    reset_day = next(row for row in rows if row['date'] == '2026-04-26')
    assert reset_day['secondary_delta_percent'] == 4.0
    assert reset_day['status'] == 'normal'

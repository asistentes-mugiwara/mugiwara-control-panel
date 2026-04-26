from __future__ import annotations

import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from apps.api.src.main import app
from apps.api.src.modules.usage.router import get_usage_service
from apps.api.src.modules.usage.service import UsageService


def _create_usage_db(path: Path, *, captured_at: str = '2026-04-26T14:29:29+00:00') -> None:
    con = sqlite3.connect(path)
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
            1777213769,
            'prolite',
            1,
            0,
            26.0,
            18000,
            '2026-04-26T10:04:43+00:00',
            '2026-04-26T15:04:43+00:00',
            2114,
            90.0,
            604800,
            '2026-04-21T18:25:51+00:00',
            '2026-04-28T18:25:51+00:00',
            186982,
            1,
            'franky',
            1,
        ),
    )
    con.commit()
    con.close()


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

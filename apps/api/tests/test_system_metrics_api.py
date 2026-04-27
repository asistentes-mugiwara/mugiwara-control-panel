from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Any

from fastapi.testclient import TestClient

from apps.api.src.main import app
from apps.api.src.modules.system.router import get_system_metrics_service
from apps.api.src.modules.system.service import SystemMetricsService


def _override_system_service(service: SystemMetricsService) -> None:
    app.dependency_overrides[get_system_metrics_service] = lambda: service


def teardown_function() -> None:
    app.dependency_overrides.clear()


def _assert_no_system_metrics_leakage(value: Any) -> None:
    serialized = str(value).lower()
    forbidden = [
        '/srv/',
        '/home/',
        '/proc/',
        '.env',
        'token',
        'secret',
        'password',
        'stdout',
        'stderr',
        'raw_output',
        'traceback',
        'mount',
        'device',
        'hostname',
        'process',
        'users',
        'command',
        'df -h',
        'free -m',
        'uptime output',
    ]
    for marker in forbidden:
        assert marker not in serialized


def test_system_metrics_returns_sanitized_allowlisted_snapshot() -> None:
    service = SystemMetricsService(
        meminfo_reader=lambda: 'MemTotal: 1000 kB\nMemFree: 999 kB\nMemAvailable: 250 kB\n',
        disk_usage_reader=lambda: SimpleNamespace(total=2000, used=500, free=1500),
        uptime_reader=lambda: '93780.42 111.00\n',
        now=lambda: datetime(2026, 4, 27, 12, 0, 0, tzinfo=timezone.utc),
    )
    _override_system_service(service)

    response = TestClient(app).get('/api/v1/system/metrics')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'system.metrics'
    assert payload['status'] == 'ready'
    assert payload['meta'] == {
        'read_only': True,
        'sanitized': True,
        'source': 'os-allowlisted-system-metrics',
        'disk_target': 'fastapi-visible-root-filesystem',
    }
    assert payload['data'] == {
        'ram': {
            'used_bytes': 768000,
            'total_bytes': 1024000,
            'used_percent': 75.0,
            'source_state': 'live',
        },
        'disk': {
            'used_bytes': 500,
            'total_bytes': 2000,
            'used_percent': 25.0,
            'source_state': 'live',
        },
        'uptime': {
            'days': 1,
            'hours': 2,
            'minutes': 3,
            'source_state': 'live',
        },
        'updated_at': '2026-04-27T12:00:00Z',
        'source_state': 'live',
    }
    _assert_no_system_metrics_leakage(payload)


def test_system_metrics_degrades_each_source_without_raw_errors_or_host_paths() -> None:
    def disk_failure():
        raise OSError('/srv/private/disk failed with token=abc and stdout=raw')

    service = SystemMetricsService(
        meminfo_reader=lambda: 'MemTotal: not-a-number kB\nMemAvailable: 1 kB\n',
        disk_usage_reader=disk_failure,
        uptime_reader=lambda: 'uptime output from /proc/uptime is malformed',
        now=lambda: datetime(2026, 4, 27, 12, 5, 0, tzinfo=timezone.utc),
    )
    _override_system_service(service)

    response = TestClient(app).get('/api/v1/system/metrics')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'system.metrics'
    assert payload['status'] == 'source_unavailable'
    assert payload['data']['source_state'] == 'degraded'
    assert payload['data']['ram'] == {
        'used_bytes': None,
        'total_bytes': None,
        'used_percent': None,
        'source_state': 'unknown',
    }
    assert payload['data']['disk'] == {
        'used_bytes': None,
        'total_bytes': None,
        'used_percent': None,
        'source_state': 'unknown',
    }
    assert payload['data']['uptime'] == {
        'days': None,
        'hours': None,
        'minutes': None,
        'source_state': 'unknown',
    }
    assert payload['data']['updated_at'] == '2026-04-27T12:05:00Z'
    _assert_no_system_metrics_leakage(payload)
    assert '/srv/private' not in response.text
    assert 'token=abc' not in response.text
    assert 'stdout=raw' not in response.text
    assert 'uptime output' not in response.text


def test_system_metrics_does_not_accept_or_echo_client_controlled_targets() -> None:
    service = SystemMetricsService(
        meminfo_reader=lambda: 'MemTotal: 1000 kB\nMemAvailable: 500 kB\n',
        disk_usage_reader=lambda: SimpleNamespace(total=100, used=10, free=90),
        uptime_reader=lambda: '60.00 0.00\n',
        now=lambda: datetime(2026, 4, 27, 12, 10, 0, tzinfo=timezone.utc),
    )
    _override_system_service(service)

    response = TestClient(app).get(
        '/api/v1/system/metrics?path=/srv/private&mount=/secret&device=/dev/sda&command=df+-h&url=https://token.example'
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'system.metrics'
    assert payload['status'] == 'ready'
    assert payload['data']['disk']['used_bytes'] == 10
    assert '/srv/private' not in response.text
    assert '/secret' not in response.text
    assert '/dev/sda' not in response.text
    assert 'df' not in response.text.lower()
    assert 'token.example' not in response.text
    _assert_no_system_metrics_leakage(payload)

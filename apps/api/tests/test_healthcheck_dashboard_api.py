from fastapi.testclient import TestClient

from apps.api.src.main import app
from apps.api.src.modules.healthcheck.service import HealthcheckService
from apps.api.src.modules.dashboard.service import DashboardService

client = TestClient(app)


def _assert_no_sensitive_host_output(value):
    forbidden = ('/srv/', '/home/', '.env', 'token', 'secret', 'password', 'raw_output', 'stdout', 'stderr', 'command')
    if isinstance(value, dict):
        for key, item in value.items():
            assert all(term not in str(key).lower() for term in forbidden)
            _assert_no_sensitive_host_output(item)
    elif isinstance(value, list):
        for item in value:
            _assert_no_sensitive_host_output(item)
    elif isinstance(value, str):
        lowered = value.lower()
        assert all(term not in lowered for term in forbidden)


def test_healthcheck_returns_sanitized_workspace():
    response = client.get('/api/v1/healthcheck')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'healthcheck.workspace'
    assert payload['status'] == 'ready'
    assert payload['meta']['read_only'] is True
    assert payload['meta']['sanitized'] is True
    assert payload['meta']['source'] == 'backend-owned-safe-catalog'

    data = payload['data']
    assert data['summary_bar']['checks_total'] == len(data['modules'])
    assert data['summary_bar']['warnings'] >= 1
    assert data['summary_bar']['incidents'] >= 0
    assert data['modules']
    assert data['events']
    assert data['signals']
    assert {'Repo público', 'Deny by default', 'Sin shell remoto'}.issubset(set(data['principles']))
    _assert_no_sensitive_host_output(payload)


def test_healthcheck_empty_source_is_not_configured():
    service = HealthcheckService(records=())

    assert service.workspace_status() == 'not_configured'
    assert service.get_workspace()['summary_bar']['checks_total'] == 0
    assert service.get_workspace()['modules'] == []
    assert service.get_workspace()['events'] == []
    assert service.get_workspace()['signals'] == []


def test_healthcheck_stale_state_is_visible():
    payload = client.get('/api/v1/healthcheck').json()

    assert any(module['status'] == 'stale' for module in payload['data']['modules'])
    stale_signal = next(signal for signal in payload['data']['signals'] if signal['status'] == 'stale')
    assert stale_signal['freshness']['label']
    assert stale_signal['warning_text']


def test_dashboard_aggregates_safe_summaries():
    response = client.get('/api/v1/dashboard')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'dashboard.summary'
    assert payload['status'] == 'ready'
    assert payload['meta']['read_only'] is True
    assert payload['meta']['sanitized'] is True
    assert payload['meta']['links_count'] == 5

    data = payload['data']
    section_ids = {section['id'] for section in data['sections']}
    assert section_ids == {'dashboard', 'healthcheck', 'mugiwaras', 'memory', 'vault', 'skills'}
    assert data['highest_severity'] in {'low', 'medium', 'high', 'critical'}
    assert data['freshness']['state'] in {'fresh', 'stale'}
    assert any(count['label'] == 'Checks con warning' for count in data['counts'])
    assert {'label': 'Abrir Healthcheck', 'href': '/healthcheck'} in data['links']
    _assert_no_sensitive_host_output(payload)


def test_dashboard_handles_unavailable_health_source_explicitly():
    dashboard = DashboardService(healthcheck_service=HealthcheckService(records=()))

    payload = dashboard.get_summary()
    health_section = next(section for section in payload['sections'] if section['id'] == 'healthcheck')
    assert health_section['status'] == 'warning'
    assert payload['freshness']['state'] == 'stale'
    assert any(count['label'] == 'Checks con warning' and count['value'] == 0 for count in payload['counts'])

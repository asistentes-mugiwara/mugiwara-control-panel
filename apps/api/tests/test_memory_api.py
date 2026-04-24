from fastapi.testclient import TestClient

from apps.api.src.main import app
from apps.api.src.modules.memory.service import MemoryService

client = TestClient(app)


def _assert_no_sensitive_keys(value):
    forbidden = {'prompt', 'prompts', 'raw', 'raw_memory', 'internal_id', 'observation_id', 'session_id', 'token', 'secret'}
    if isinstance(value, dict):
        lowered = {str(key).lower() for key in value.keys()}
        assert forbidden.isdisjoint(lowered)
        for item in value.values():
            _assert_no_sensitive_keys(item)
    elif isinstance(value, list):
        for item in value:
            _assert_no_sensitive_keys(item)


def test_memory_summary_returns_safe_allowlisted_items():
    response = client.get('/api/v1/memory')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'memory.summary'
    assert payload['status'] == 'ready'
    assert payload['meta']['read_only'] is True
    assert payload['meta']['sources'] == ['built-in', 'honcho']
    assert payload['meta']['sanitized'] is True
    assert payload['meta']['count'] >= 8

    item = next(entry for entry in payload['data']['items'] if entry['mugiwara_slug'] == 'zoro')
    assert set(item.keys()) == {'mugiwara_slug', 'summary', 'fact_count', 'last_updated', 'badges'}
    assert item['fact_count'] >= 1
    assert item['badges']
    _assert_no_sensitive_keys(payload)


def test_memory_detail_returns_summary_without_raw_memory_dump():
    response = client.get('/api/v1/memory/zoro')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'memory.agent_detail'
    assert payload['status'] == 'ready'
    assert payload['meta'] == {'mugiwara_slug': 'zoro', 'read_only': True, 'sanitized': True}

    data = payload['data']
    assert data['mugiwara_slug'] == 'zoro'
    assert isinstance(data['built_in_summary'], str)
    assert data['built_in_summary']
    assert isinstance(data['honcho_facts'], list)
    assert 1 <= len(data['honcho_facts']) <= 3
    assert data['freshness']['status'] in {'fresh', 'stale', 'unknown'}
    assert data['links'] == [{'label': 'Ver Mugiwara', 'href': '/mugiwaras'}]
    _assert_no_sensitive_keys(payload)


def test_memory_unknown_slug_returns_semantic_404_without_paths():
    response = client.get('/api/v1/memory/unknown')

    assert response.status_code == 404
    detail = response.json()['detail']
    assert detail['code'] == 'not_found'
    assert 'unknown' not in detail['message'].lower()
    assert '/srv/' not in detail['message']
    assert '/home/' not in detail['message']


def test_memory_service_empty_source_is_not_configured():
    service = MemoryService(records=())

    assert service.list_summary() == []
    status = service.catalog_status()
    assert status == 'not_configured'

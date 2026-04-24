from fastapi.testclient import TestClient

from apps.api.src.main import app

client = TestClient(app)


def _assert_no_host_paths(value):
    if isinstance(value, dict):
        for key, item in value.items():
            if key not in {'path'}:
                assert '/srv/' not in str(item)
                assert '/home/' not in str(item)
            _assert_no_host_paths(item)
    elif isinstance(value, list):
        for item in value:
            _assert_no_host_paths(item)
    elif isinstance(value, str):
        assert '/srv/' not in value
        assert '/home/' not in value


def test_vault_workspace_returns_allowlisted_documents():
    response = client.get('/api/v1/vault')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'vault.workspace'
    assert payload['status'] == 'ready'
    assert payload['meta'] == {'safe_root': 'canonical_vault', 'read_only': True, 'allowlisted': True}

    data = payload['data']
    assert data['active_document_id'] == 'mugiwara-control-panel-summary'
    assert data['freshness']['state'] == 'fresh'
    assert len(data['tree']) >= 3
    assert len(data['documents']) == 3
    assert {document['id'] for document in data['documents']} == {
        'mugiwara-control-panel-summary',
        'memory-governance',
        'pr-governance',
    }
    _assert_no_host_paths(payload)


def test_vault_document_reads_markdown_only_allowlisted_path():
    response = client.get('/api/v1/vault/documents/03-Projects/Project Summary - Mugiwara Control Panel.md')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'vault.document'
    assert payload['meta']['markdown_only'] is True
    assert payload['meta']['allowlisted'] is True
    assert payload['data']['id'] == 'mugiwara-control-panel-summary'
    assert payload['data']['meta']['path'] == '03-Projects/Project Summary - Mugiwara Control Panel.md'
    assert payload['data']['sections']
    _assert_no_host_paths(payload)


def test_vault_rejects_path_traversal_without_host_path_leak():
    response = client.get('/api/v1/vault/documents/00-System/%2e%2e/Policy - Memory governance.md')

    assert response.status_code == 400
    detail = response.json()['detail']
    assert detail['code'] == 'validation_error'
    assert '/srv/' not in detail['message']
    assert '/home/' not in detail['message']


def test_vault_rejects_unknown_markdown_document():
    response = client.get('/api/v1/vault/documents/00-System/Unknown.md')

    assert response.status_code == 404
    detail = response.json()['detail']
    assert detail['code'] == 'not_found'
    assert '/srv/' not in detail['message']


def test_vault_rejects_unsupported_extension():
    response = client.get('/api/v1/vault/documents/README.txt')

    assert response.status_code == 415
    detail = response.json()['detail']
    assert detail['code'] == 'unsupported_media_type'
    assert '/srv/' not in detail['message']

from fastapi.testclient import TestClient

from apps.api.src.main import app

from apps.api.src.modules.vault.domain import VaultCategory, VaultDocumentEntry
from apps.api.src.modules.vault.service import VaultService

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


def test_vault_rejects_allowlisted_symlink_inside_root(tmp_path):
    docs = tmp_path / 'docs'
    docs.mkdir()
    target = docs / 'target.md'
    target.write_text('# Target\n\n## Body\n\nSafe body.', encoding='utf-8')
    link = docs / 'allowed.md'
    link.symlink_to(target)
    entry = VaultDocumentEntry(
        document_id='allowed',
        label='Allowed',
        relative_path='docs/allowed.md',
        category_id='docs',
        category_label='Docs',
        summary='Allowed symlink should be rejected.',
        context='Synthetic test fixture.',
    )
    service = VaultService(root=tmp_path, categories=(VaultCategory('docs', 'Docs', 'docs', 'Docs', (entry,)),))

    try:
        service.get_document_by_id('allowed')
    except Exception as exc:
        assert getattr(exc, 'status_code') == 503
        assert exc.detail['code'] == 'source_unavailable'
    else:
        raise AssertionError('allowlisted symlink should be rejected')


def test_vault_sanitizes_sensitive_title_and_headings(tmp_path):
    docs = tmp_path / 'docs'
    docs.mkdir()
    doc = docs / 'allowed.md'
    doc.write_text(
        '# /srv/secret-title\n\n## token heading\n\nVisible paragraph.\n\n## Safe heading\n\n/home/hidden paragraph\n\nVisible safe paragraph.',
        encoding='utf-8',
    )
    entry = VaultDocumentEntry(
        document_id='allowed',
        label='Allowed fallback title',
        relative_path='docs/allowed.md',
        category_id='docs',
        category_label='Docs',
        summary='Synthetic markdown.',
        context='Synthetic test fixture.',
    )
    service = VaultService(root=tmp_path, categories=(VaultCategory('docs', 'Docs', 'docs', 'Docs', (entry,)),))

    payload = service.get_document_by_id('allowed')
    serialized = str(payload)
    assert payload.title == 'Allowed fallback title'
    assert '/srv/' not in serialized
    assert '/home/' not in serialized
    assert 'token heading' not in serialized.lower()
    assert any(section.heading == 'Sección saneada' for section in payload.sections)
    assert any('Visible safe paragraph.' in section.body for section in payload.sections)

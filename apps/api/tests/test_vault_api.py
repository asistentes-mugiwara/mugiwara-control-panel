from fastapi.testclient import TestClient

from apps.api.src.main import app

from apps.api.src.modules.vault.domain import VaultCategory, VaultDocumentEntry
from apps.api.src.modules.vault.router import get_vault_service
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
    assert payload['meta'] == {'safe_root': 'canonical_vault', 'read_only': True, 'allowlisted': True, 'sanitized': True}

    data = payload['data']
    assert data['active_document_id'] == 'mugiwara-control-panel-summary'
    assert data['freshness']['state'] == 'fresh'
    assert len(data['tree']) >= 3
    assert len(data['documents']) == 3
    assert data['explorer']['read_only'] is True
    assert data['explorer']['safe_root'] == 'canonical_vault'
    assert data['explorer']['sanitized'] is True
    assert {document['id'] for document in data['documents']} == {
        'mugiwara-control-panel-summary',
        'memory-governance',
        'pr-governance',
    }
    _assert_no_host_paths(payload)


def test_vault_tree_endpoint_returns_dynamic_explorer_from_safe_root(tmp_path):
    (tmp_path / '00-System').mkdir()
    (tmp_path / '00-System' / 'Policy.md').write_text('# Policy\n', encoding='utf-8')
    (tmp_path / '00-System' / '.env').write_text('TOKEN=secret\n', encoding='utf-8')
    (tmp_path / '.git').mkdir()
    (tmp_path / '.git' / 'config').write_text('private git config\n', encoding='utf-8')
    (tmp_path / 'README.txt').write_text('not markdown\n', encoding='utf-8')
    (tmp_path / 'Big.md').write_text('x' * 64, encoding='utf-8')
    (tmp_path / 'Linked.md').symlink_to(tmp_path / '00-System' / 'Policy.md')

    service = VaultService(root=tmp_path, max_document_bytes=32)
    app.dependency_overrides[get_vault_service] = lambda: service
    try:
        response = client.get('/api/v1/vault/tree')
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'vault.explorer_tree'
    assert payload['meta'] == {'safe_root': 'canonical_vault', 'read_only': True, 'sanitized': True}
    tree = payload['data']
    assert tree['read_only'] is True
    assert tree['safe_root'] == 'canonical_vault'
    assert tree['sanitized'] is True
    assert tree['max_document_bytes'] == 32
    paths = {node['relative_path'] for node in tree['nodes']}
    assert '00-System' in paths
    assert '00-System/Policy.md' in paths
    assert '.git' not in paths
    assert '00-System/.env' not in paths
    assert 'README.txt' not in paths
    assert 'Big.md' not in paths
    assert 'Linked.md' not in paths
    assert any(document['relative_path'] == '00-System/Policy.md' for document in tree['documents'])
    _assert_no_host_paths(payload)
    serialized = str(payload)
    assert '.env' not in serialized
    assert '.git' not in serialized
    assert 'secret' not in serialized.lower()


def test_vault_explorer_tree_enforces_depth_and_node_limits(tmp_path):
    current = tmp_path
    for index in range(4):
        current = current / f'level-{index}'
        current.mkdir()
        (current / f'doc-{index}.md').write_text('# Doc\n', encoding='utf-8')

    shallow_service = VaultService(root=tmp_path, max_tree_depth=1, max_tree_nodes=50)
    shallow_tree = shallow_service.get_explorer_tree()
    shallow_paths = {node['relative_path'] for node in shallow_tree['nodes']}
    assert 'level-0' in shallow_paths
    assert 'level-0/doc-0.md' in shallow_paths
    assert 'level-0/level-1' not in shallow_paths

    capped_service = VaultService(root=tmp_path, max_tree_depth=8, max_tree_nodes=2)
    capped_tree = capped_service.get_explorer_tree()
    assert len(capped_tree['nodes']) == 2
    assert capped_tree['limits']['nodes_truncated'] is True


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

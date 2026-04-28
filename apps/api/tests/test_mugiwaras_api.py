from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from apps.api.src.main import app
from apps.api.src.modules.mugiwaras.router import get_mugiwaras_service
from apps.api.src.modules.mugiwaras.service import MugiwaraService


def build_service(tmp_path: Path) -> MugiwaraService:
    crew_rules_path = tmp_path / 'crew-core' / 'AGENTS.md'
    crew_rules_path.parent.mkdir(parents=True)
    crew_rules_path.write_text('# AGENTS.md\n\nCanon Mugiwara saneado.\n', encoding='utf-8')
    return MugiwaraService(crew_rules_path=crew_rules_path)


def test_mugiwaras_catalog_returns_safe_cards_and_canonical_agents_document(tmp_path: Path) -> None:
    service = build_service(tmp_path)
    app.dependency_overrides[get_mugiwaras_service] = lambda: service
    client = TestClient(app)

    response = client.get('/api/v1/mugiwaras')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'mugiwaras.catalog'
    assert payload['status'] == 'ready'
    assert payload['meta']['count'] >= 4
    assert payload['meta']['crew_rules_document'] == '/srv/crew-core/AGENTS.md'
    assert {item['slug'] for item in payload['data']['items']} >= {'luffy', 'zoro', 'usopp', 'chopper'}
    cards_by_slug = {item['slug']: item for item in payload['data']['items']}
    assert {'label': 'Ver Skills', 'href': '/skills?mugiwara=franky'} in cards_by_slug['franky']['links']
    assert {'label': 'Ver Skills', 'href': '/skills?mugiwara=zoro'} in cards_by_slug['zoro']['links']
    assert payload['data']['crew_rules_document'] == {
        'document_id': 'crew-core-agents',
        'title': 'AGENTS.md — reglas operativas Mugiwara',
        'display_path': '/srv/crew-core/AGENTS.md',
        'source_label': 'crew-core canonical AGENTS.md',
        'read_only': True,
        'canonical': True,
        'markdown': '# AGENTS.md\n\nCanon Mugiwara saneado.\n',
    }

    app.dependency_overrides.clear()


def test_mugiwara_detail_returns_profile_and_rejects_unknown_slug(tmp_path: Path) -> None:
    service = build_service(tmp_path)
    app.dependency_overrides[get_mugiwaras_service] = lambda: service
    client = TestClient(app)

    detail = client.get('/api/v1/mugiwaras/zoro')
    assert detail.status_code == 200
    payload = detail.json()
    assert payload['resource'] == 'mugiwaras.profile'
    assert payload['data']['slug'] == 'zoro'
    assert payload['data']['identity']['name'] == 'Zoro'
    assert payload['data']['identity']['crest_src'].startswith('/assets/mugiwaras/crests/')

    unknown = client.get('/api/v1/mugiwaras/unknown')
    assert unknown.status_code == 404
    assert unknown.json()['detail']['code'] == 'not_found'
    assert '/srv/crew-core' not in unknown.text

    app.dependency_overrides.clear()


def test_mugiwaras_catalog_does_not_follow_hermes_agents_symlink(tmp_path: Path) -> None:
    canonical = tmp_path / 'crew-core' / 'AGENTS.md'
    canonical.parent.mkdir(parents=True)
    canonical.write_text('canonical', encoding='utf-8')

    hermes_agents = tmp_path / '.hermes' / 'hermes-agent' / 'AGENTS.md'
    hermes_agents.parent.mkdir(parents=True)
    hermes_agents.symlink_to(canonical)

    service = MugiwaraService(crew_rules_path=hermes_agents)
    app.dependency_overrides[get_mugiwaras_service] = lambda: service
    client = TestClient(app)

    response = client.get('/api/v1/mugiwaras')

    assert response.status_code == 503
    assert response.json()['detail']['code'] == 'source_unavailable'
    assert str(hermes_agents) not in response.text

    app.dependency_overrides.clear()


def test_mugiwaras_catalog_rejects_parent_directory_symlink(tmp_path: Path) -> None:
    real_root = tmp_path / 'real-crew-core'
    real_root.mkdir()
    (real_root / 'AGENTS.md').write_text('canonical through parent symlink', encoding='utf-8')

    symlink_root = tmp_path / 'crew-core-link'
    symlink_root.symlink_to(real_root, target_is_directory=True)

    service = MugiwaraService(crew_rules_path=symlink_root / 'AGENTS.md')
    app.dependency_overrides[get_mugiwaras_service] = lambda: service
    client = TestClient(app)

    response = client.get('/api/v1/mugiwaras')

    assert response.status_code == 503
    assert response.json()['detail']['code'] == 'source_unavailable'
    assert str(symlink_root) not in response.text
    assert str(real_root) not in response.text

    app.dependency_overrides.clear()

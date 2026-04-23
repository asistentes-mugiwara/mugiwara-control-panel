from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from apps.api.src.main import app
from apps.api.src.modules.skills.domain import SkillRegistryEntry
from apps.api.src.modules.skills.router import get_skill_service
from apps.api.src.modules.skills.service import SkillService


def build_service(tmp_path: Path) -> tuple[SkillService, Path]:
    allowed_root = tmp_path / 'skills-source'
    skill_dir = allowed_root / 'agents' / 'zoro' / 'demo-skill'
    skill_dir.mkdir(parents=True)
    skill_path = skill_dir / 'SKILL.md'
    skill_path.write_text("""---
name: demo-skill
description: demo
---

# Demo
""", encoding='utf-8')

    runtime_skill_dir = tmp_path / '.config' / 'opencode' / 'skills' / 'judgment-day'
    runtime_skill_dir.mkdir(parents=True)
    runtime_skill_path = runtime_skill_dir / 'SKILL.md'
    runtime_skill_path.write_text("""---
name: judgment-day
description: runtime
---
""", encoding='utf-8')

    service = SkillService(
        registry=(
            SkillRegistryEntry(
                skill_id='demo-skill',
                display_name='Demo skill',
                owner_scope='agent',
                public_repo_risk='low',
                repo_path=str(skill_path),
                path=skill_path,
                editable=True,
            ),
            SkillRegistryEntry(
                skill_id='judgment-day',
                display_name='Judgment Day',
                owner_scope='runtime',
                public_repo_risk='high',
                repo_path=str(runtime_skill_path),
                path=runtime_skill_path,
                editable=False,
            ),
        ),
        allowed_root=allowed_root,
        audit_log_path=tmp_path / 'runtime' / 'skills-audit.jsonl',
    )
    return service, skill_path


def test_catalog_lists_editable_and_read_only_entries(tmp_path: Path) -> None:
    service, _ = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    response = client.get('/api/v1/skills')
    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'skills.catalog'
    assert payload['meta']['editable_count'] == 1
    assert {item['skill_id'] for item in payload['data']['items']} == {'demo-skill', 'judgment-day'}

    app.dependency_overrides.clear()


def test_detail_returns_fingerprint(tmp_path: Path) -> None:
    service, skill_path = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    response = client.get('/api/v1/skills/demo-skill')
    assert response.status_code == 200
    payload = response.json()
    assert payload['data']['repo_path'] == str(skill_path)
    assert len(payload['data']['fingerprint']['sha256']) == 64

    app.dependency_overrides.clear()


def test_preview_and_update_skill_with_audit(tmp_path: Path) -> None:
    service, skill_path = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    detail = client.get('/api/v1/skills/demo-skill').json()['data']
    current_sha = detail['fingerprint']['sha256']
    updated_content = detail['content'] + """
## Updated
- change
"""

    preview = client.post(
        '/api/v1/skills/demo-skill/preview',
        json={'content': updated_content, 'expected_sha256': current_sha},
    )
    assert preview.status_code == 200
    assert preview.json()['data']['diff_summary']['lines_added'] >= 2

    update = client.put(
        '/api/v1/skills/demo-skill',
        json={'actor': 'zoro', 'content': updated_content, 'expected_sha256': current_sha},
    )
    assert update.status_code == 200
    payload = update.json()
    assert payload['data']['audit']['result'] == 'success'
    assert skill_path.read_text(encoding='utf-8') == updated_content

    audit = client.get('/api/v1/skills/audit')
    assert audit.status_code == 200
    audit_items = audit.json()['data']['items']
    assert audit_items[0]['actor'] == 'zoro'
    assert audit_items[0]['skill_id'] == 'demo-skill'

    app.dependency_overrides.clear()


def test_rejects_stale_fingerprint(tmp_path: Path) -> None:
    service, _ = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    response = client.put(
        '/api/v1/skills/demo-skill',
        json={'actor': 'zoro', 'content': """---
name: demo-skill
description: demo
---
""", 'expected_sha256': '0' * 64},
    )
    assert response.status_code == 409
    assert response.json()['detail']['code'] == 'stale'

    audit_log = tmp_path / 'runtime' / 'skills-audit.jsonl'
    lines = audit_log.read_text(encoding='utf-8').splitlines()
    last_record = json.loads(lines[-1])
    assert last_record['result'] == 'rejected'

    app.dependency_overrides.clear()


def test_rejects_read_only_runtime_skill(tmp_path: Path) -> None:
    service, _ = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    detail = client.get('/api/v1/skills/judgment-day')
    assert detail.status_code == 200
    fingerprint = detail.json()['data']['fingerprint']['sha256']

    response = client.put(
        '/api/v1/skills/judgment-day',
        json={'actor': 'zoro', 'content': detail.json()['data']['content'], 'expected_sha256': fingerprint},
    )
    assert response.status_code == 403
    assert response.json()['detail']['code'] == 'forbidden'

    app.dependency_overrides.clear()

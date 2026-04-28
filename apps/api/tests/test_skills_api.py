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

    global_skill_dir = allowed_root / 'global' / 'shared-skill'
    global_skill_dir.mkdir(parents=True)
    global_skill_path = global_skill_dir / 'SKILL.md'
    global_skill_path.write_text("""---
name: shared-skill
description: shared
---
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
                skill_id='global-shared-skill',
                display_name='Shared skill',
                owner_scope='shared',
                owner_slug='global',
                owner_label='Global',
                public_repo_risk='low',
                repo_path=str(global_skill_path),
                path=global_skill_path,
                editable=True,
            ),
            SkillRegistryEntry(
                skill_id='agent-zoro-demo-skill',
                display_name='Demo skill',
                owner_scope='agent',
                owner_slug='zoro',
                owner_label='Zoro',
                public_repo_risk='low',
                repo_path=str(skill_path),
                path=skill_path,
                editable=True,
            ),
            SkillRegistryEntry(
                skill_id='runtime-judgment-day',
                display_name='Judgment Day',
                owner_scope='runtime',
                owner_slug='runtime',
                owner_label='Runtime OpenCode',
                public_repo_risk='high',
                repo_path=str(runtime_skill_path),
                path=runtime_skill_path,
                editable=False,
            ),
        ),
        allowed_root=allowed_root,
        runtime_root=tmp_path / '.config' / 'opencode' / 'skills',
        audit_log_path=tmp_path / 'runtime' / 'skills-audit.jsonl',
    )
    return service, skill_path


def test_catalog_marks_all_visible_entries_editable(tmp_path: Path) -> None:
    service, _ = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    response = client.get('/api/v1/skills')
    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'skills.catalog'
    assert payload['meta']['editable_count'] == 3
    assert {item['skill_id'] for item in payload['data']['items']} == {'global-shared-skill', 'agent-zoro-demo-skill', 'runtime-judgment-day'}
    assert all(item['editable'] is True for item in payload['data']['items'])

    app.dependency_overrides.clear()


def test_default_registry_discovers_global_and_agent_skills(tmp_path: Path) -> None:
    allowed_root = tmp_path / 'skills-source'
    global_skill = allowed_root / 'global' / 'mugiwara-git-identity' / 'SKILL.md'
    franky_skill = allowed_root / 'agents' / 'franky' / 'vault-sync-ops' / 'SKILL.md'
    ignored_skill = allowed_root / 'agents' / 'unknown-agent' / 'private-scratch' / 'SKILL.md'
    for skill_path in (global_skill, franky_skill, ignored_skill):
        skill_path.parent.mkdir(parents=True)
        skill_path.write_text(f"""---
name: {skill_path.parent.name}
description: demo
---
""", encoding='utf-8')

    service = SkillService(allowed_root=allowed_root, audit_log_path=tmp_path / 'runtime' / 'skills-audit.jsonl')
    catalog = service.list_catalog()
    by_id = {item.skill_id: item for item in catalog}

    assert by_id['global-mugiwara-git-identity'].owner_scope == 'shared'
    assert by_id['global-mugiwara-git-identity'].owner_slug == 'global'
    assert by_id['agent-franky-vault-sync-ops'].owner_scope == 'agent'
    assert by_id['agent-franky-vault-sync-ops'].owner_slug == 'franky'
    assert 'agent-unknown-agent-private-scratch' not in by_id


def test_rejects_path_like_or_invalid_skill_ids(tmp_path: Path) -> None:
    service, _ = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    for skill_id in ('..%2fsecret', 'agent-zoro-demo skill', 'a' * 142):
        response = client.get(f'/api/v1/skills/{skill_id}')
        assert response.status_code == 404
        detail = response.json()['detail']
        if isinstance(detail, dict):
            assert detail['code'] == 'not_found'

    app.dependency_overrides.clear()


def test_rejects_allowlisted_skill_symlink(tmp_path: Path) -> None:
    allowed_root = tmp_path / 'skills-source'
    target_dir = allowed_root / 'agents' / 'zoro' / 'target-skill'
    target_dir.mkdir(parents=True)
    target = target_dir / 'SKILL.md'
    target.write_text("""---
name: target-skill
description: demo
---
""", encoding='utf-8')

    symlink_dir = allowed_root / 'agents' / 'zoro' / 'symlink-skill'
    symlink_dir.mkdir(parents=True)
    symlink_path = symlink_dir / 'SKILL.md'
    symlink_path.symlink_to(target)

    service = SkillService(
        registry=(
            SkillRegistryEntry(
                skill_id='agent-zoro-symlink-skill',
                display_name='Symlink skill',
                owner_scope='agent',
                owner_slug='zoro',
                owner_label='Zoro',
                public_repo_risk='low',
                repo_path=str(symlink_path),
                path=symlink_path,
                editable=True,
            ),
        ),
        allowed_root=allowed_root,
        runtime_root=tmp_path / '.config' / 'opencode' / 'skills',
        audit_log_path=tmp_path / 'runtime' / 'skills-audit.jsonl',
    )
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    response = client.get('/api/v1/skills/agent-zoro-symlink-skill')
    assert response.status_code == 503
    assert response.json()['detail']['code'] == 'source_unavailable'
    assert str(target) not in response.text

    app.dependency_overrides.clear()


def test_detail_returns_fingerprint(tmp_path: Path) -> None:
    service, skill_path = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    response = client.get('/api/v1/skills/agent-zoro-demo-skill')
    assert response.status_code == 200
    payload = response.json()
    assert payload['data']['repo_path'] == str(skill_path)
    assert len(payload['data']['fingerprint']['sha256']) == 64

    app.dependency_overrides.clear()


def test_preview_and_update_skill_with_audit(tmp_path: Path) -> None:
    service, skill_path = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    detail = client.get('/api/v1/skills/agent-zoro-demo-skill').json()['data']
    current_sha = detail['fingerprint']['sha256']
    updated_content = detail['content'] + """
## Updated
- change
"""

    preview = client.post(
        '/api/v1/skills/agent-zoro-demo-skill/preview',
        json={'content': updated_content, 'expected_sha256': current_sha},
    )
    assert preview.status_code == 200
    assert preview.json()['data']['diff_summary']['lines_added'] >= 2

    update = client.put(
        '/api/v1/skills/agent-zoro-demo-skill',
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
    assert audit_items[0]['skill_id'] == 'agent-zoro-demo-skill'

    app.dependency_overrides.clear()


def test_update_derives_audit_actor_from_skill_owner_not_payload(tmp_path: Path) -> None:
    service, _ = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    expected_actors = {
        'agent-zoro-demo-skill': 'zoro',
        'global-shared-skill': 'luffy',
        'runtime-judgment-day': 'runtime',
    }
    spoofed_actors = {
        'agent-zoro-demo-skill': 'luffy',
        'global-shared-skill': 'zoro',
        'runtime-judgment-day': 'luffy',
    }

    for skill_id, expected_actor in expected_actors.items():
        detail = client.get(f'/api/v1/skills/{skill_id}').json()['data']
        updated_content = detail['content'] + f"\n## spoof check {skill_id}\n"
        response = client.put(
            f'/api/v1/skills/{skill_id}',
            json={
                'actor': spoofed_actors[skill_id],
                'content': updated_content,
                'expected_sha256': detail['fingerprint']['sha256'],
            },
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload['data']['audit']['actor'] == expected_actor
        assert payload['meta']['actor'] == expected_actor

    app.dependency_overrides.clear()


def test_rejects_stale_fingerprint(tmp_path: Path) -> None:
    service, _ = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    response = client.put(
        '/api/v1/skills/agent-zoro-demo-skill',
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


def test_runtime_skill_is_editable_when_inside_runtime_root(tmp_path: Path) -> None:
    service, _ = build_service(tmp_path)
    app.dependency_overrides[get_skill_service] = lambda: service
    client = TestClient(app)

    detail = client.get('/api/v1/skills/runtime-judgment-day')
    assert detail.status_code == 200
    payload = detail.json()['data']
    assert payload['editable'] is True
    fingerprint = payload['fingerprint']['sha256']
    updated_content = payload['content'] + "\n## Runtime edit\n- controlled\n"

    response = client.put(
        '/api/v1/skills/runtime-judgment-day',
        json={'actor': 'runtime', 'content': updated_content, 'expected_sha256': fingerprint},
    )
    assert response.status_code == 200
    assert response.json()['data']['audit']['result'] == 'success'
    assert response.json()['data']['audit']['actor'] == 'runtime'

    app.dependency_overrides.clear()

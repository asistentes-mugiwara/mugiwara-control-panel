from __future__ import annotations

import subprocess
from pathlib import Path
from types import SimpleNamespace
from typing import Any

from fastapi.testclient import TestClient

from apps.api.src.main import app


FORBIDDEN_LEAKAGE_MARKERS = [
    '/srv/',
    '/home/',
    '/tmp/',
    '.env',
    'token',
    'secret',
    'password',
    'stdout',
    'stderr',
    'traceback',
    'raw_output',
    'remote',
    'origin',
    'github.com:',
    'git@',
    'command',
    'private',
]


def _git(repo: Path, *args: str) -> None:
    subprocess.run(
        ['git', *args],
        cwd=repo,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )


def _make_repo(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    _git(path, 'init', '-b', 'main')
    _git(path, 'config', 'user.name', 'fixture')
    _git(path, 'config', 'user.email', 'fixture@example.invalid')
    (path / 'README.md').write_text('# fixture\n', encoding='utf-8')
    _git(path, 'add', 'README.md')
    _git(path, 'commit', '-m', 'initial fixture commit')
    return path


def _assert_no_leakage(value: Any) -> None:
    serialized = str(value).lower()
    for marker in FORBIDDEN_LEAKAGE_MARKERS:
        assert marker not in serialized


def _install_git_control_override(registry):
    from apps.api.src.modules.git_control.router import get_git_control_service
    from apps.api.src.modules.git_control.service import GitControlService

    service = GitControlService(registry=registry)
    app.dependency_overrides[get_git_control_service] = lambda: service


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_git_repos_lists_only_allowlisted_sanitized_repositories(tmp_path: Path) -> None:
    from apps.api.src.modules.git_control.registry import GitRepoDefinition, GitRepoRegistry

    clean_repo = _make_repo(tmp_path / 'clean-private-repo')
    registry = GitRepoRegistry(
        repos=(
            GitRepoDefinition(
                repo_id='fixture-clean',
                label='Fixture clean repository',
                scope='test',
                path=clean_repo,
            ),
        )
    )
    _install_git_control_override(registry)

    response = TestClient(app).get('/api/v1/git/repos?path=/srv/private&url=git@github.com:secret/repo.git')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'git.repo_index'
    assert payload['status'] == 'ready'
    assert payload['meta'] == {
        'read_only': True,
        'sanitized': True,
        'source': 'backend-owned-git-registry',
    }
    assert payload['data']['repos'] == [
        {
            'repo_id': 'fixture-clean',
            'label': 'Fixture clean repository',
            'scope': 'test',
            'status': {
                'source_state': 'live',
                'working_tree': 'clean',
                'changed_files_count': 0,
                'untracked_files_count': 0,
                'current_branch': 'main',
            },
        }
    ]
    _assert_no_leakage(payload)
    assert '/srv/private' not in response.text
    assert 'secret/repo' not in response.text


def test_git_repo_status_reports_dirty_without_file_names_or_paths(tmp_path: Path) -> None:
    from apps.api.src.modules.git_control.registry import GitRepoDefinition, GitRepoRegistry

    repo = _make_repo(tmp_path / 'dirty-private-repo')
    (repo / '.env').write_text('TOKEN=super-secret-value\n', encoding='utf-8')
    (repo / 'README.md').write_text('# changed\n', encoding='utf-8')
    registry = GitRepoRegistry(
        repos=(GitRepoDefinition(repo_id='fixture-dirty', label='Fixture dirty repository', scope='test', path=repo),)
    )
    _install_git_control_override(registry)

    response = TestClient(app).get('/api/v1/git/repos/fixture-dirty/status')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'git.repo_status'
    assert payload['status'] == 'ready'
    assert payload['data'] == {
        'repo_id': 'fixture-dirty',
        'status': {
            'source_state': 'live',
            'working_tree': 'dirty',
            'changed_files_count': 1,
            'untracked_files_count': 1,
            'current_branch': 'main',
        },
    }
    assert '.env' not in response.text
    assert 'super-secret-value' not in response.text
    assert 'README.md' not in response.text
    _assert_no_leakage(payload)


def test_git_repo_status_neutralizes_local_fsmonitor_hook(tmp_path: Path) -> None:
    from apps.api.src.modules.git_control.registry import GitRepoDefinition, GitRepoRegistry

    repo = _make_repo(tmp_path / 'fsmonitor-private-repo')
    marker = tmp_path / 'fsmonitor-ran-marker'
    hook = tmp_path / 'fsmonitor-hook.sh'
    hook.write_text(f'#!/bin/sh\nprintf ran > "{marker}"\nexit 0\n', encoding='utf-8')
    hook.chmod(0o700)
    _git(repo, 'config', 'core.fsmonitor', str(hook))
    registry = GitRepoRegistry(
        repos=(
            GitRepoDefinition(repo_id='fixture-fsmonitor', label='Fixture fsmonitor repository', scope='test', path=repo),
        )
    )
    _install_git_control_override(registry)

    response = TestClient(app).get('/api/v1/git/repos/fixture-fsmonitor/status')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'git.repo_status'
    assert payload['status'] == 'ready'
    assert payload['data']['status']['source_state'] == 'live'
    assert payload['data']['status']['working_tree'] == 'clean'
    assert not marker.exists()
    assert str(hook) not in response.text
    _assert_no_leakage(payload)


def test_git_unknown_repo_id_returns_sanitized_not_found_without_echoing_input(tmp_path: Path) -> None:
    from apps.api.src.modules.git_control.registry import GitRepoRegistry

    _install_git_control_override(GitRepoRegistry(repos=()))

    response = TestClient(app).get('/api/v1/git/repos/unknown-private-token/status?path=/srv/private')

    assert response.status_code == 404
    payload = response.json()
    assert payload['detail'] == {
        'code': 'git_repo_not_found',
        'message': 'Git repository is not configured.',
    }
    assert 'unknown-private-token' not in response.text
    assert '/srv/private' not in response.text
    _assert_no_leakage(payload)


def test_git_status_invocation_disables_executable_git_config(monkeypatch, tmp_path: Path) -> None:
    from apps.api.src.modules.git_control.git_adapter import GitStatusAdapter
    from apps.api.src.modules.git_control.registry import GitRepoDefinition

    captured: dict[str, Any] = {}

    def fake_run(args, **kwargs):
        captured['args'] = args
        captured['kwargs'] = kwargs
        return SimpleNamespace(stdout='## main\n')

    monkeypatch.setattr('apps.api.src.modules.git_control.git_adapter.subprocess.run', fake_run)

    status = GitStatusAdapter().read_status(
        GitRepoDefinition(repo_id='fixture-policy', label='Fixture policy repository', scope='test', path=tmp_path)
    )

    args = captured['args']
    env = captured['kwargs']['env']
    assert status.source_state == 'live'
    assert captured['kwargs']['shell'] is False
    assert captured['kwargs']['cwd'] == tmp_path
    assert captured['kwargs']['timeout'] == 2.0
    assert '-c' in args
    assert 'core.fsmonitor=false' in args
    assert 'core.hooksPath=/dev/null' in args
    assert env['GIT_CONFIG_NOSYSTEM'] == '1'
    assert env['GIT_CONFIG_GLOBAL'] == '/dev/null'
    assert env['GIT_CONFIG_SYSTEM'] == '/dev/null'


def test_git_repo_status_degrades_safely_for_unreadable_or_non_git_repo(tmp_path: Path) -> None:
    from apps.api.src.modules.git_control.registry import GitRepoDefinition, GitRepoRegistry

    not_git = tmp_path / 'not-a-git-repo-private-token'
    not_git.mkdir()
    registry = GitRepoRegistry(
        repos=(GitRepoDefinition(repo_id='fixture-broken', label='Fixture broken repository', scope='test', path=not_git),)
    )
    _install_git_control_override(registry)

    response = TestClient(app).get('/api/v1/git/repos/fixture-broken/status')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'git.repo_status'
    assert payload['status'] == 'source_unavailable'
    assert payload['data'] == {
        'repo_id': 'fixture-broken',
        'status': {
            'source_state': 'unknown',
            'working_tree': 'unknown',
            'changed_files_count': None,
            'untracked_files_count': None,
            'current_branch': None,
        },
    }
    assert 'not-a-git-repo-private-token' not in response.text
    _assert_no_leakage(payload)

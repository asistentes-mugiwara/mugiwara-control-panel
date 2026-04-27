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


def _commit_file(repo: Path, filename: str, content: str, subject: str, body: str = '') -> str:
    (repo / filename).write_text(content, encoding='utf-8')
    _git(repo, 'add', filename)
    if body:
        _git(repo, 'commit', '-m', subject, '-m', body)
    else:
        _git(repo, 'commit', '-m', subject)
    result = subprocess.run(
        ['git', 'rev-parse', 'HEAD'],
        cwd=repo,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return result.stdout.strip()


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


def test_git_commits_lists_recent_commits_with_mugiwara_trailers_and_safe_cursor(tmp_path: Path) -> None:
    from apps.api.src.modules.git_control.registry import GitRepoDefinition, GitRepoRegistry

    repo = _make_repo(tmp_path / 'commits-private-repo')
    older_sha = _commit_file(
        repo,
        'agent-note.md',
        'agent note\n',
        'docs: add agent note',
        'Detailed body line.\n\nMugiwara-Agent: zoro\nSigned-off-by: zoro <asistentes.mugiwara@gmail.com>',
    )
    newer_sha = _commit_file(repo, 'ops-note.md', 'ops note\n', 'fix: add ops note')
    registry = GitRepoRegistry(
        repos=(GitRepoDefinition(repo_id='fixture-commits', label='Fixture commits repository', scope='test', path=repo),)
    )
    _install_git_control_override(registry)

    first_page = TestClient(app).get('/api/v1/git/repos/fixture-commits/commits?limit=1')

    assert first_page.status_code == 200
    payload = first_page.json()
    assert payload['resource'] == 'git.commit_list'
    assert payload['status'] == 'ready'
    assert payload['meta']['read_only'] is True
    assert payload['meta']['sanitized'] is True
    assert payload['data']['repo_id'] == 'fixture-commits'
    assert payload['data']['limit'] == 1
    assert len(payload['data']['commits']) == 1
    assert payload['data']['commits'][0]['sha'] == newer_sha
    assert payload['data']['commits'][0]['short_sha'] == newer_sha[:12]
    assert payload['data']['commits'][0]['subject'] == 'fix: add ops note'
    assert payload['data']['commits'][0]['trailers'] == {'mugiwara_agent': None, 'signed_off_by': None}
    assert payload['data']['next_cursor'] == 'offset:1'
    _assert_no_leakage(payload)

    second_page = TestClient(app).get('/api/v1/git/repos/fixture-commits/commits?limit=2&cursor=offset:1')
    assert second_page.status_code == 200
    second_payload = second_page.json()
    returned_shas = [commit['sha'] for commit in second_payload['data']['commits']]
    assert older_sha in returned_shas
    trailer_commit = next(commit for commit in second_payload['data']['commits'] if commit['sha'] == older_sha)
    assert trailer_commit['trailers'] == {
        'mugiwara_agent': 'zoro',
        'signed_off_by': 'zoro <asistentes.mugiwara@gmail.com>',
    }
    assert 'Detailed body line.' in trailer_commit['body']
    assert '.git' not in second_page.text
    _assert_no_leakage(second_payload)


def test_git_branches_lists_local_branches_only_without_remotes_or_paths(tmp_path: Path) -> None:
    from apps.api.src.modules.git_control.registry import GitRepoDefinition, GitRepoRegistry

    repo = _make_repo(tmp_path / 'branches-private-repo')
    main_sha = _commit_file(repo, 'main.txt', 'main\n', 'feat: main branch note')
    _git(repo, 'switch', '-c', 'zoro/fixture-safe')
    branch_sha = _commit_file(repo, 'branch.txt', 'branch\n', 'feat: branch note')
    _git(repo, 'remote', 'add', 'origin', 'git@github.com:private/secret-repo.git')
    registry = GitRepoRegistry(
        repos=(GitRepoDefinition(repo_id='fixture-branches', label='Fixture branches repository', scope='test', path=repo),)
    )
    _install_git_control_override(registry)

    response = TestClient(app).get('/api/v1/git/repos/fixture-branches/branches?ref=origin/main&path=/srv/private')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'git.branch_list'
    assert payload['status'] == 'ready'
    assert payload['data']['repo_id'] == 'fixture-branches'
    assert payload['data']['current_branch'] == 'zoro/fixture-safe'
    branches = {branch['name']: branch for branch in payload['data']['branches']}
    assert set(branches) == {'main', 'zoro/fixture-safe'}
    assert branches['main']['sha'] == main_sha
    assert branches['main']['short_sha'] == main_sha[:12]
    assert branches['main']['current'] is False
    assert branches['zoro/fixture-safe']['sha'] == branch_sha
    assert branches['zoro/fixture-safe']['current'] is True
    assert 'origin' not in response.text
    assert 'secret-repo' not in response.text
    assert '/srv/private' not in response.text
    _assert_no_leakage(payload)


def test_git_commits_reject_invalid_limit_and_malicious_cursor_without_echo(tmp_path: Path) -> None:
    from apps.api.src.modules.git_control.registry import GitRepoDefinition, GitRepoRegistry

    repo = _make_repo(tmp_path / 'validation-private-repo')
    registry = GitRepoRegistry(
        repos=(GitRepoDefinition(repo_id='fixture-validation', label='Fixture validation repository', scope='test', path=repo),)
    )
    _install_git_control_override(registry)

    bad_limit = TestClient(app).get('/api/v1/git/repos/fixture-validation/commits?limit=999')
    bad_cursor = TestClient(app).get('/api/v1/git/repos/fixture-validation/commits?cursor=HEAD..main:/srv/private-token')

    assert bad_limit.status_code == 400
    assert bad_limit.json()['detail']['code'] == 'git_invalid_limit'
    assert '999' not in bad_limit.text
    assert bad_cursor.status_code == 400
    assert bad_cursor.json()['detail']['code'] == 'git_invalid_cursor'
    assert 'HEAD' not in bad_cursor.text
    assert '/srv/private-token' not in bad_cursor.text
    _assert_no_leakage(bad_limit.json())
    _assert_no_leakage(bad_cursor.json())


def test_git_commits_unknown_repo_and_degraded_repo_are_sanitized(tmp_path: Path) -> None:
    from apps.api.src.modules.git_control.registry import GitRepoDefinition, GitRepoRegistry

    not_git = tmp_path / 'not-git-private-token'
    not_git.mkdir()
    registry = GitRepoRegistry(
        repos=(GitRepoDefinition(repo_id='fixture-broken-commits', label='Fixture broken repository', scope='test', path=not_git),)
    )
    _install_git_control_override(registry)

    unknown = TestClient(app).get('/api/v1/git/repos/unknown-private-token/commits?cursor=offset:0')
    degraded = TestClient(app).get('/api/v1/git/repos/fixture-broken-commits/commits')

    assert unknown.status_code == 404
    assert unknown.json()['detail']['code'] == 'git_repo_not_found'
    assert 'unknown-private-token' not in unknown.text
    assert degraded.status_code == 200
    payload = degraded.json()
    assert payload['resource'] == 'git.commit_list'
    assert payload['status'] == 'source_unavailable'
    assert payload['data'] == {
        'repo_id': 'fixture-broken-commits',
        'commits': [],
        'limit': 25,
        'next_cursor': None,
        'source_state': 'unknown',
    }
    assert 'not-git-private-token' not in degraded.text
    _assert_no_leakage(unknown.json())
    _assert_no_leakage(payload)


def test_git_read_model_invocations_stay_allowlisted_and_hardened(monkeypatch, tmp_path: Path) -> None:
    from apps.api.src.modules.git_control.git_adapter import GitReadAdapter
    from apps.api.src.modules.git_control.registry import GitRepoDefinition

    captured: list[dict[str, Any]] = []

    def fake_run(args, **kwargs):
        captured.append({'args': args, 'kwargs': kwargs})
        if 'branch' in args:
            return SimpleNamespace(stdout='main\x00*\x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n')
        return SimpleNamespace(stdout='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\x1faaaaaaaaaaaa\x1ffixture\x1ffixture@example.invalid\x1f2026-04-27T10:00:00+00:00\x1f2026-04-27T10:00:00+00:00\x1ffeat: safe\x1fbody\x1e')

    monkeypatch.setattr('apps.api.src.modules.git_control.git_adapter.subprocess.run', fake_run)
    adapter = GitReadAdapter()
    repo = GitRepoDefinition(repo_id='fixture-policy', label='Fixture policy repository', scope='test', path=tmp_path)

    adapter.list_commits(repo, limit=1, cursor=None)
    adapter.list_branches(repo)

    assert len(captured) == 2
    for call in captured:
        args = call['args']
        kwargs = call['kwargs']
        assert args[0] == 'git'
        assert '--no-optional-locks' in args
        assert 'core.fsmonitor=false' in args
        assert 'core.hooksPath=/dev/null' in args
        assert kwargs['shell'] is False
        assert kwargs['cwd'] == tmp_path
        assert kwargs['timeout'] == 2.0
        assert kwargs['env']['GIT_CONFIG_GLOBAL'] == '/dev/null'
        assert kwargs['env']['GIT_CONFIG_SYSTEM'] == '/dev/null'
        assert kwargs['env']['GIT_CONFIG_NOSYSTEM'] == '1'
        assert not any(command in args for command in ['checkout', 'reset', 'commit', 'push', 'pull', 'fetch', 'stash', 'merge', 'rebase'])

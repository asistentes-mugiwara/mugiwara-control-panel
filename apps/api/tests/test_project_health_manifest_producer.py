from __future__ import annotations

import importlib.util
import json
import stat
import subprocess
from pathlib import Path


def _load_producer_module():
    module_path = Path(__file__).resolve().parents[3] / 'scripts' / 'write-project-health-status.py'
    spec = importlib.util.spec_from_file_location('write_project_health_status', module_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _git(repo: Path, *args: str) -> None:
    subprocess.run(['git', '-C', str(repo), *args], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def _init_repo(tmp_path: Path) -> Path:
    repo = tmp_path / 'repo'
    repo.mkdir()
    _git(repo, 'init', '-b', 'main')
    _git(repo, 'config', 'user.name', 'Test Zoro')
    _git(repo, 'config', 'user.email', 'zoro@example.invalid')
    (repo / 'README.md').write_text('safe\n', encoding='utf-8')
    _git(repo, 'add', 'README.md')
    _git(repo, 'commit', '-m', 'initial')
    origin = tmp_path / 'origin.git'
    subprocess.run(['git', 'init', '--bare', str(origin)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    _git(repo, 'remote', 'add', 'origin', str(origin))
    _git(repo, 'push', '-u', 'origin', 'main')
    return repo


def test_project_health_manifest_producer_writes_minimal_safe_atomic_json(tmp_path):
    producer = _load_producer_module()
    repo = _init_repo(tmp_path)
    output = tmp_path / 'runtime' / 'healthcheck' / 'project-health-status.json'

    result = producer.write_project_health_status(repo_path=repo, output_path=output, now='2026-04-25T20:15:00Z')

    assert result == {
        'status': 'success',
        'result': 'success',
        'updated_at': '2026-04-25T20:15:00Z',
        'workspace_clean': True,
        'main_branch': True,
        'remote_synced': True,
    }
    manifest = json.loads(output.read_text(encoding='utf-8'))
    assert manifest == result
    assert set(manifest) == {'status', 'result', 'updated_at', 'workspace_clean', 'main_branch', 'remote_synced'}
    serialized = json.dumps(manifest)
    assert '"main"' not in serialized
    assert 'origin' not in serialized
    assert 'README' not in serialized
    assert 'diff' not in serialized
    assert 'stdout' not in serialized
    assert 'stderr' not in serialized
    assert output.parent.stat().st_mode & stat.S_IROTH == 0
    assert output.stat().st_mode & stat.S_IROTH == 0


def test_project_health_manifest_producer_degrades_dirty_not_main_and_unsynced_without_leaking(tmp_path):
    producer = _load_producer_module()
    repo = _init_repo(tmp_path)
    _git(repo, 'switch', '-c', 'feature/private-branch')
    (repo / '.env').write_text('TOKEN=secret\n', encoding='utf-8')
    output = tmp_path / 'runtime' / 'healthcheck' / 'project-health-status.json'

    result = producer.write_project_health_status(repo_path=repo, output_path=output, now='2026-04-25T20:20:00Z')

    assert result['status'] == 'dirty'
    assert result['result'] == 'dirty'
    assert result['workspace_clean'] is False
    assert result['main_branch'] is False
    assert result['remote_synced'] is False
    serialized = output.read_text(encoding='utf-8')
    assert 'feature/private-branch' not in serialized
    assert '.env' not in serialized
    assert 'TOKEN' not in serialized
    assert 'secret' not in serialized
    assert 'origin' not in serialized


def test_project_health_manifest_producer_reports_unsynced_main_without_raw_remote_details(tmp_path):
    producer = _load_producer_module()
    repo = _init_repo(tmp_path)
    (repo / 'README.md').write_text('safe\nnext\n', encoding='utf-8')
    _git(repo, 'add', 'README.md')
    _git(repo, 'commit', '-m', 'local ahead')
    output = tmp_path / 'runtime' / 'healthcheck' / 'project-health-status.json'

    result = producer.write_project_health_status(repo_path=repo, output_path=output, now='2026-04-25T20:25:00Z')

    assert result['status'] == 'diverged'
    assert result['result'] == 'diverged'
    assert result['workspace_clean'] is True
    assert result['main_branch'] is True
    assert result['remote_synced'] is False
    serialized = output.read_text(encoding='utf-8')
    assert 'origin' not in serialized
    assert 'HEAD' not in serialized
    assert 'local ahead' not in serialized


def test_project_health_manifest_producer_cli_accepts_safe_paths(tmp_path):
    producer = _load_producer_module()
    repo = _init_repo(tmp_path)
    output = tmp_path / 'status.json'

    exit_code = producer.main(['--repo', str(repo), '--output', str(output), '--now', '2026-04-25T20:30:00Z'])

    assert exit_code == 0
    manifest = json.loads(output.read_text(encoding='utf-8'))
    assert manifest['status'] == 'success'

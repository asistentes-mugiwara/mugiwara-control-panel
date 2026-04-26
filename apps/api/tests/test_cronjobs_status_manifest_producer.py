from __future__ import annotations

import importlib.util
import json
import stat
from pathlib import Path


def _load_producer_module():
    module_path = Path(__file__).resolve().parents[3] / 'scripts' / 'write-cronjobs-status.py'
    spec = importlib.util.spec_from_file_location('write_cronjobs_status', module_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _write_profile_jobs(profiles_root: Path, profile: str, jobs: list[dict[str, object]]) -> None:
    cron_dir = profiles_root / profile / 'cron'
    cron_dir.mkdir(parents=True)
    (cron_dir / 'jobs.json').write_text(json.dumps({'jobs': jobs, 'updated_at': '2026-04-26T08:00:00Z'}), encoding='utf-8')


def test_cronjobs_status_manifest_producer_writes_minimal_safe_atomic_json(tmp_path):
    producer = _load_producer_module()
    profiles_root = tmp_path / 'profiles'
    output = tmp_path / 'runtime' / 'healthcheck' / 'cronjobs-status.json'
    _write_profile_jobs(
        profiles_root,
        'luffy',
        [
            {
                'id': '85098807a103',
                'name': 'vault-sync',
                'prompt': 'cat /srv/crew-core/.env TOKEN prompt body',
                'enabled': True,
                'state': 'scheduled',
                'schedule': {'kind': 'interval', 'minutes': 15},
                'last_run_at': '2026-04-26T07:55:00Z',
                'last_status': 'ok',
                'deliver': 'telegram:-100synthetic',
                'origin': {'chat_id': 'synthetic-chat-id'},
                'stdout': 'raw output secret',
            },
            {
                'id': 'e164d1ff0d9d',
                'name': 'zoro-public-showcase-nightly',
                'prompt': 'delivery target and command should never be serialized',
                'enabled': True,
                'state': 'scheduled',
                'schedule': {'kind': 'cron', 'expr': '30 23 * * *'},
                'last_run_at': '2026-04-25T23:30:00Z',
                'last_status': 'ok',
            },
        ],
    )
    _write_profile_jobs(
        profiles_root,
        'sanji',
        [
            {
                'id': 'ff42e7760906',
                'name': 'Sanji caducidades servicios 60 dias',
                'enabled': True,
                'state': 'scheduled',
                'schedule': {'kind': 'cron', 'expr': '0 9 * * 1,3,5'},
                'last_run_at': '2026-04-26T07:30:00Z',
                'last_status': 'success',
            },
            {
                'id': 'future-once',
                'name': 'future one-shot should not enter recurring registry',
                'enabled': True,
                'state': 'scheduled',
                'schedule': {'kind': 'once', 'display': 'once at 2026-05-08 08:30'},
                'last_run_at': None,
                'last_status': None,
            },
        ],
    )

    result = producer.write_cronjobs_status(
        profiles_root=profiles_root,
        output_path=output,
        now='2026-04-26T08:05:00Z',
    )

    assert result['status'] == 'success'
    assert result['result'] == 'success'
    assert result['updated_at'] == '2026-04-26T08:05:00Z'
    assert set(result) == {'status', 'result', 'updated_at', 'jobs'}
    assert result['jobs'] == [
        {'last_run_at': '2026-04-26T07:55:00Z', 'last_status': 'success', 'criticality': 'critical'},
        {'last_run_at': '2026-04-25T23:30:00Z', 'last_status': 'success', 'criticality': 'normal'},
        {'last_run_at': '2026-04-26T07:30:00Z', 'last_status': 'success', 'criticality': 'normal'},
    ]

    manifest = json.loads(output.read_text(encoding='utf-8'))
    assert manifest == result
    serialized = json.dumps(manifest)
    for forbidden in [
        'vault-sync',
        'zoro-public-showcase-nightly',
        'Sanji',
        'prompt',
        'prompt body',
        'command',
        'delivery target',
        'chat_id',
        'synthetic-chat-id',
        'stdout',
        'raw output',
        'TOKEN',
        '.env',
        '/srv/crew-core',
        'telegram:',
        'profile',
        'owner',
    ]:
        assert forbidden not in serialized
    assert output.parent.stat().st_mode & stat.S_IROTH == 0
    assert output.stat().st_mode & stat.S_IROTH == 0


def test_cronjobs_status_manifest_producer_degrades_failed_or_missing_critical_job(tmp_path):
    producer = _load_producer_module()
    profiles_root = tmp_path / 'profiles'
    output = tmp_path / 'cronjobs-status.json'
    _write_profile_jobs(
        profiles_root,
        'luffy',
        [
            {
                'id': '85098807a103',
                'name': 'vault-sync',
                'enabled': True,
                'state': 'scheduled',
                'schedule': {'kind': 'interval', 'minutes': 15},
                'last_run_at': '2026-04-26T07:55:00Z',
                'last_status': 'failed',
                'stderr': 'secret traceback',
            },
            {
                'id': '35c40bf3a2a5',
                'name': 'system-backup-nightly',
                'enabled': True,
                'state': 'scheduled',
                'schedule': {'kind': 'cron', 'expr': '30 3 * * *'},
                'last_run_at': None,
                'last_status': None,
            },
        ],
    )

    result = producer.write_cronjobs_status(
        profiles_root=profiles_root,
        output_path=output,
        now='2026-04-26T08:10:00Z',
    )

    assert result['status'] == 'failed'
    assert result['result'] == 'failed'
    assert result['jobs'] == [
        {'last_run_at': '2026-04-26T07:55:00Z', 'last_status': 'failed', 'criticality': 'critical'},
    ]
    serialized = output.read_text(encoding='utf-8')
    assert 'vault-sync' not in serialized
    assert 'system-backup-nightly' not in serialized
    assert 'stderr' not in serialized
    assert 'secret traceback' not in serialized


def test_cronjobs_status_manifest_producer_cli_accepts_safe_output_and_now(tmp_path):
    producer = _load_producer_module()
    profiles_root = tmp_path / 'profiles'
    output = tmp_path / 'cronjobs-status.json'
    _write_profile_jobs(
        profiles_root,
        'usopp',
        [
            {
                'id': '85524e24ea8c',
                'name': 'usopp-mugiwara-no-hermes-editorial-maintenance',
                'enabled': True,
                'state': 'scheduled',
                'schedule': {'kind': 'cron', 'expr': '0 2 * * *'},
                'last_run_at': '2026-04-26T02:00:00Z',
                'last_status': 'ok',
            }
        ],
    )

    exit_code = producer.main(
        ['--profiles-root', str(profiles_root), '--output', str(output), '--now', '2026-04-26T08:15:00Z']
    )

    assert exit_code == 0
    manifest = json.loads(output.read_text(encoding='utf-8'))
    assert manifest['status'] == 'success'
    assert manifest['updated_at'] == '2026-04-26T08:15:00Z'
    assert manifest['jobs'] == [
        {'last_run_at': '2026-04-26T02:00:00Z', 'last_status': 'success', 'criticality': 'normal'}
    ]

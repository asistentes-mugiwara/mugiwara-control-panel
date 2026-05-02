from fastapi.testclient import TestClient

from apps.api.src.main import app
import pytest

from apps.api.src.modules.healthcheck.domain import (
    HEALTHCHECK_CHECK_IDS,
    HEALTHCHECK_FRESHNESS_STATES,
    HEALTHCHECK_SEVERITY_VALUES,
    HEALTHCHECK_SOURCE_FAMILY_IDS,
    HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS,
    HEALTHCHECK_SOURCE_LABELS,
    HEALTHCHECK_SOURCE_MANIFEST_POLICIES,
    HEALTHCHECK_STATUS_VALUES,
    HealthcheckEvent,
    HealthcheckRecord,
)
from apps.api.src.modules.healthcheck.registry import HealthcheckSourceRegistry
from apps.api.src.modules.healthcheck.router import get_healthcheck_service
from apps.api.src.modules.healthcheck.source_adapters import BackupHealthManifestAdapter, CronjobsManifestAdapter, GatewayStatusManifestAdapter, ProjectHealthManifestAdapter, VaultSyncManifestAdapter
from apps.api.src.modules.healthcheck.service import HealthcheckService
from apps.api.src.modules.dashboard.service import DashboardService

client = TestClient(app)


def _record(module_id, label, status, severity, updated_at):
    return HealthcheckRecord(
        module_id=module_id,
        label=label,
        status=status,
        severity=severity,
        updated_at=updated_at,
        summary=f'{label} safe summary',
        warning_text='Synthetic safe warning.',
        source_label='Synthetic safe source',
        freshness_label='Synthetic freshness',
    )


def _record_event(event_id, source, status, timestamp):
    return HealthcheckEvent(
        event_id=event_id,
        source=source,
        status=status,
        timestamp=timestamp,
        detail='Synthetic historical event.',
    )


def _assert_no_sensitive_host_output(value):
    forbidden = ('/srv/', '/home/', '.env', 'token', 'secret', 'password', 'raw_output', 'stdout', 'stderr', 'command', 'pid', 'container_id', 'docker_id', 'mount', 'remote_url', 'prompt_body', 'chat_id', 'delivery_target')
    if isinstance(value, dict):
        for key, item in value.items():
            assert all(term not in str(key).lower() for term in forbidden)
            _assert_no_sensitive_host_output(item)
    elif isinstance(value, list):
        for item in value:
            _assert_no_sensitive_host_output(item)
    elif isinstance(value, str):
        lowered = value.lower()
        assert all(term not in lowered for term in forbidden)


def test_healthcheck_contract_vocabulary_is_backend_owned():
    assert set(HEALTHCHECK_STATUS_VALUES) == {'pass', 'warn', 'fail', 'stale', 'not_configured', 'unknown'}
    assert set(HEALTHCHECK_SEVERITY_VALUES) == {'low', 'medium', 'high', 'critical', 'unknown'}
    assert set(HEALTHCHECK_FRESHNESS_STATES) == {'fresh', 'stale', 'unknown'}
    assert set(HEALTHCHECK_SOURCE_FAMILY_IDS) == {
        'vault-sync',
        'project-health',
        'backup-health',
        'hermes-gateways',
        'gateway.luffy',
        'gateway.zoro',
        'gateway.nami',
        'gateway.usopp',
        'gateway.sanji',
        'gateway.chopper',
        'gateway.robin',
        'gateway.franky',
        'gateway.brook',
        'gateway.jinbe',
        'cronjobs',
    }
    assert set(HEALTHCHECK_CHECK_IDS) == {
        'vault-sync.last-sync',
        'project-health.workspace',
        'backup-health.last-backup',
        'hermes-gateways.global',
        'gateway.luffy.process',
        'gateway.zoro.process',
        'gateway.nami.process',
        'gateway.usopp.process',
        'gateway.sanji.process',
        'gateway.chopper.process',
        'gateway.robin.process',
        'gateway.franky.process',
        'gateway.brook.process',
        'gateway.jinbe.process',
        'cronjobs.registry',
    }


def test_healthcheck_manifest_and_freshness_policy_is_backend_owned():
    assert HEALTHCHECK_SOURCE_MANIFEST_POLICIES['vault-sync']['owner'] == 'franky'
    assert HEALTHCHECK_SOURCE_MANIFEST_POLICIES['backup-health']['owner'] == 'franky'
    assert HEALTHCHECK_SOURCE_MANIFEST_POLICIES['cronjobs']['owner'] == 'franky'
    assert HEALTHCHECK_SOURCE_MANIFEST_POLICIES['cronjobs']['safe_location_class'] == 'shared-manifest-registry'
    assert 'zoro profile-local cronjob list' in HEALTHCHECK_SOURCE_MANIFEST_POLICIES['cronjobs']['exclusions']
    assert all('/srv/' not in policy['safe_location_class'] for policy in HEALTHCHECK_SOURCE_MANIFEST_POLICIES.values())

    assert HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS['vault-sync'] == {'warn_after_minutes': 90, 'fail_after_minutes': 360}
    assert HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS['backup-health'] == {'warn_after_minutes': 1800, 'fail_after_minutes': 4320}
    assert HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS['cronjobs'] == {'warn_after_minutes': 180, 'fail_after_minutes': 720}
    assert HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS['hermes-gateways'] == {'warn_after_minutes': 15, 'fail_after_minutes': 60}
    assert HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS['gateway.zoro'] == {'warn_after_minutes': 15, 'fail_after_minutes': 60}


def test_healthcheck_rejects_invalid_status_severity_and_freshness():
    valid_record = _record('cronjobs', 'Cronjobs', 'warn', 'medium', '2026-04-24T07:41:00Z')
    with pytest.raises(ValueError, match='Unsupported healthcheck status'):
        HealthcheckService(records=(valid_record, _record('backup-health', 'Backups', 'healthy', 'low', '2026-04-24T07:35:00Z'))).get_workspace()
    with pytest.raises(ValueError, match='Unsupported healthcheck severity'):
        HealthcheckService(records=(valid_record, _record('backup-health', 'Backups', 'pass', 'minor', '2026-04-24T07:35:00Z'))).get_workspace()
    with pytest.raises(ValueError, match='Unsupported healthcheck freshness state'):
        HealthcheckService(records=(valid_record,), freshness_state_by_module={'cronjobs': 'current'}).get_workspace()


def test_healthcheck_signal_check_ids_do_not_derive_from_client_or_dynamic_input():
    payload = HealthcheckService(
        records=(
            _record('cronjobs', 'Cronjobs', 'warn', 'medium', '2026-04-24T07:41:00Z'),
            _record('gateway.zoro', 'Zoro gateway', 'warn', 'medium', '2026-04-24T07:44:00Z'),
        )
    ).get_workspace()

    assert {signal['check_id'] for signal in payload['signals']} == {'cronjobs.registry', 'gateway.zoro.process'}

    with pytest.raises(ValueError, match='Unsupported healthcheck source id') as exc_info:
        HealthcheckService(records=(_record('gateway../../etc/passwd', 'Injected gateway', 'warn', 'high', '2026-04-24T07:44:00Z'),)).get_workspace()
    assert 'gateway../../etc/passwd' not in str(exc_info.value)


def test_healthcheck_source_registry_normalizes_allowed_fields_only():
    snapshot = HealthcheckSourceRegistry().normalize(
        'cronjobs',
        {
            'label': 'Cronjobs',
            'status': 'warn',
            'severity': 'medium',
            'updated_at': '2026-04-24T07:41:00Z',
            'summary': 'Safe cron summary.',
            'warning_text': 'Synthetic safe warning.',
            'source_label': 'Cron safe summary',
            'freshness_label': 'Actualizado hace 5 min',
            'freshness_state': 'stale',
            'path': '/srv/crew-core/private/.env',
            'url': 'https://internal.example/redacted',
            'method': 'POST',
            'stdout': 'synthetic sensitive stdout',
            'stderr': 'Traceback with /home/agentops/.env',
            'raw_output': 'synthetic raw output',
            'command': 'cat /srv/crew-core/.env',
            'traceback': 'internal traceback',
            'pid': 1234,
            'unit_content': '[Service] Environment=SYNTHETIC_REDACTED',
            'journal': 'journal raw logs',
            'backup_path': '/srv/backups/private',
            'included_path': '/home/agentops/private',
            'prompt_body': 'synthetic prompt body',
            'chat_id': 'synthetic-chat-id',
            'delivery_target': 'telegram:synthetic-chat-id',
            'cookie': 'synthetic-cookie',
            'credentials': 'synthetic-credentials',
            'git_diff': 'diff --git a/.env b/.env',
            'untracked_files': ['.env'],
            'remote_url': 'git@github.com:private/repo.git',
        },
    )

    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    assert payload['modules'] == [
        {
            'module_id': 'cronjobs',
            'label': 'Cronjobs',
            'status': 'warn',
            'severity': 'medium',
            'updated_at': '2026-04-24T07:41:00Z',
            'summary': 'Safe cron summary.',
        }
    ]
    assert payload['signals'][0]['check_id'] == 'cronjobs.registry'
    assert payload['signals'][0]['freshness']['state'] == 'stale'
    _assert_no_sensitive_host_output(payload)


def test_healthcheck_source_registry_sanitizes_sensitive_allowed_text_fields():
    snapshot = HealthcheckSourceRegistry().normalize(
        'vault-sync',
        {
            'label': 'Vault sync /srv/crew-core/private/.env token',
            'status': 'warn',
            'severity': 'medium',
            'updated_at': '2026-04-24T07:41:00Z',
            'summary': 'token leaked at /srv/crew-core/private/.env',
            'warning_text': 'stderr includes secret marker and command output',
            'source_label': 'raw_output from /home/agentops/.env',
            'freshness_label': 'password appeared in journal stdout',
            'freshness_state': 'stale',
        },
    )

    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    module = payload['modules'][0]
    signal = payload['signals'][0]
    assert module['label'] == 'Vault sync'
    assert signal['label'] == 'Vault sync'
    assert module['summary'] == 'Resumen Healthcheck saneado por política de seguridad.'
    assert signal['warning_text'] == 'Detalle Healthcheck omitido por política de seguridad.'
    assert signal['source_label'] == 'Healthcheck source registry'
    assert signal['freshness']['label'] == 'Frescura desconocida'
    _assert_no_sensitive_host_output(payload)


def test_healthcheck_source_registry_uses_backend_owned_label_when_adapter_label_is_sensitive():
    snapshot = HealthcheckSourceRegistry().normalize(
        'vault-sync',
        {
            'label': 'Vault sync /srv/crew-core/private/.env token',
            'status': 'warn',
            'severity': 'medium',
            'updated_at': '2026-04-24T07:41:00Z',
            'summary': 'Safe vault summary.',
            'warning_text': 'Synthetic safe warning.',
            'source_label': 'Vault safe summary',
            'freshness_label': 'Actualizado hace 5 min',
            'freshness_state': 'stale',
        },
    )

    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    assert payload['modules'][0]['label'] == HEALTHCHECK_SOURCE_LABELS['vault-sync']
    assert payload['signals'][0]['label'] == HEALTHCHECK_SOURCE_LABELS['vault-sync']
    _assert_no_sensitive_host_output(payload)


def test_healthcheck_source_registry_models_absent_unreadable_and_unregistered_as_degraded():
    registry = HealthcheckSourceRegistry()
    service = HealthcheckService.from_source_snapshots(
        (
            registry.normalize_absent('vault-sync'),
            registry.normalize_unreadable('backup-health'),
            registry.normalize_unregistered('gateway.zoro'),
        )
    )

    payload = service.get_workspace()

    status_by_module = {module['module_id']: module['status'] for module in payload['modules']}
    assert status_by_module == {
        'vault-sync': 'not_configured',
        'backup-health': 'unknown',
        'gateway.zoro': 'not_configured',
    }
    assert payload['summary_bar']['overall_status'] != 'pass'
    assert payload['summary_bar']['warnings'] == 3
    assert {signal['check_id'] for signal in payload['signals']} == {
        'vault-sync.last-sync',
        'backup-health.last-backup',
        'gateway.zoro.process',
    }
    _assert_no_sensitive_host_output(payload)


def test_vault_sync_manifest_adapter_maps_recent_success_to_safe_pass(tmp_path):
    manifest = tmp_path / 'vault-sync-status.json'
    manifest.write_text(
        '{"status":"success","last_success_at":"2026-04-24T07:30:00Z","updated_at":"2026-04-24T07:30:00Z","branch":"main","ahead":0,"behind":0}',
        encoding='utf-8',
    )

    snapshot = VaultSyncManifestAdapter(manifest_path=manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    assert payload['modules'] == [
        {
            'module_id': 'vault-sync',
            'label': 'Vault sync',
            'status': 'pass',
            'severity': 'low',
            'updated_at': '2026-04-24T07:30:00Z',
            'summary': 'Vault sincronizado recientemente.',
        }
    ]
    assert payload['signals'] == []
    _assert_no_sensitive_host_output(payload)


def test_vault_sync_manifest_adapter_degrades_stale_and_ignores_manifest_noise(tmp_path):
    manifest = tmp_path / 'vault-sync-status.json'
    manifest.write_text(
        '{"status":"success","last_success_at":"2026-04-24T01:00:00Z","updated_at":"2026-04-24T01:00:00Z","path":"/srv/crew-core/vault/.env","stdout":"token secret raw_output","remote_url":"git@github.com:private/repo.git"}',
        encoding='utf-8',
    )

    snapshot = VaultSyncManifestAdapter(manifest_path=manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    module = payload['modules'][0]
    signal = payload['signals'][0]
    assert module['status'] == 'stale'
    assert module['severity'] == 'high'
    assert module['updated_at'] == '2026-04-24T01:00:00Z'
    assert signal['check_id'] == 'vault-sync.last-sync'
    assert signal['freshness']['state'] == 'stale'
    assert signal['warning_text'] == 'Vault sync stale; revisar fuente operacional.'
    _assert_no_sensitive_host_output(payload)


def test_vault_sync_manifest_adapter_models_missing_or_unreadable_manifest(tmp_path):
    missing = VaultSyncManifestAdapter(manifest_path=tmp_path / 'missing.json').snapshot(now='2026-04-24T08:00:00Z')
    unreadable_manifest = tmp_path / 'vault-sync-status.json'
    unreadable_manifest.write_text('{not-json', encoding='utf-8')
    unreadable = VaultSyncManifestAdapter(manifest_path=unreadable_manifest).snapshot(now='2026-04-24T08:00:00Z')

    payload = HealthcheckService.from_source_snapshots((missing, unreadable)).get_workspace()

    status_by_module = {module['summary']: module['status'] for module in payload['modules']}
    assert status_by_module == {
        'Fuente Healthcheck ausente o todavía no configurada.': 'not_configured',
        'Fuente Healthcheck no legible; no se expone salida cruda.': 'unknown',
    }
    _assert_no_sensitive_host_output(payload)


def test_backup_health_manifest_adapter_maps_recent_success_to_safe_pass(tmp_path):
    manifest = tmp_path / 'backup-health-status.json'
    manifest.write_text(
        '{"status":"success","last_success_at":"2026-04-24T07:30:00Z","checksum_present":true,"retention_count":4,"archive_path":"/srv/crew-core/backups/private.tar.gz","included_path":"/home/agentops/private","stdout":"token secret raw_output"}',
        encoding='utf-8',
    )

    snapshot = BackupHealthManifestAdapter(manifest_path=manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    assert payload['modules'] == [
        {
            'module_id': 'backup-health',
            'label': 'Backups',
            'status': 'pass',
            'severity': 'low',
            'updated_at': '2026-04-24T07:30:00Z',
            'summary': 'Backup local reciente con checksum disponible.',
        }
    ]
    assert payload['signals'] == []
    _assert_no_sensitive_host_output(payload)


def test_backup_health_manifest_adapter_degrades_stale_and_missing_checksum(tmp_path):
    stale_manifest = tmp_path / 'backup-health-stale.json'
    stale_manifest.write_text(
        '{"status":"success","last_success_at":"2026-04-21T08:00:00Z","checksum_present":true,"retention_count":4}',
        encoding='utf-8',
    )
    missing_checksum_manifest = tmp_path / 'backup-health-missing-checksum.json'
    missing_checksum_manifest.write_text(
        '{"status":"success","last_success_at":"2026-04-24T07:30:00Z","checksum_present":false,"retention_count":4}',
        encoding='utf-8',
    )

    stale = BackupHealthManifestAdapter(manifest_path=stale_manifest).snapshot(now='2026-04-24T08:00:00Z')
    missing_checksum = BackupHealthManifestAdapter(manifest_path=missing_checksum_manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((stale, missing_checksum)).get_workspace()

    status_by_summary = {module['summary']: module['status'] for module in payload['modules']}
    assert status_by_summary == {
        'Backup local stale según manifiesto seguro.': 'stale',
        'Backup local sin checksum seguro disponible.': 'warn',
    }
    assert {signal['check_id'] for signal in payload['signals']} == {'backup-health.last-backup'}
    assert all(signal['freshness']['state'] == 'stale' for signal in payload['signals'])
    _assert_no_sensitive_host_output(payload)


@pytest.mark.parametrize('degraded_status', ['warn', 'warning', 'stale'])
def test_backup_health_manifest_adapter_preserves_explicit_degraded_status(tmp_path, degraded_status):
    manifest = tmp_path / f'backup-health-{degraded_status}.json'
    manifest.write_text(
        f'{{"status":"{degraded_status}","last_success_at":"2026-04-24T07:30:00Z","checksum_present":true,"retention_count":4}}',
        encoding='utf-8',
    )

    snapshot = BackupHealthManifestAdapter(manifest_path=manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    module = payload['modules'][0]
    signal = payload['signals'][0]
    assert module['status'] == 'warn'
    assert module['severity'] == 'medium'
    assert module['summary'] == 'Backup local requiere revisión según manifiesto seguro.'
    assert signal['warning_text'] == 'Backup local con degradación explícita.'
    assert signal['freshness']['state'] == 'stale'
    _assert_no_sensitive_host_output(payload)


@pytest.mark.parametrize(
    'manifest_body',
    [
        '{"last_success_at":"2026-04-24T07:30:00Z","checksum_present":true,"retention_count":4}',
        '{"status":"green","last_success_at":"2026-04-24T07:30:00Z","checksum_present":true,"retention_count":4}',
        '{"result":"done","last_success_at":"2026-04-24T07:30:00Z","checksum_present":true,"retention_count":4}',
    ],
)
def test_backup_health_manifest_adapter_requires_explicit_positive_result(tmp_path, manifest_body):
    manifest = tmp_path / 'backup-health-unsafe-result.json'
    manifest.write_text(manifest_body, encoding='utf-8')

    snapshot = BackupHealthManifestAdapter(manifest_path=manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    module = payload['modules'][0]
    assert module['status'] == 'warn'
    assert module['severity'] == 'medium'
    assert module['summary'] == 'Backup local sin resultado seguro disponible.'
    assert payload['signals'][0]['freshness']['state'] == 'stale'
    _assert_no_sensitive_host_output(payload)


@pytest.mark.parametrize(
    ('manifest_body', 'expected_summary'),
    [
        (
            '{"status":"success","last_success_at":"2026-04-24T07:30:00Z","retention_count":4}',
            'Backup local sin checksum seguro disponible.',
        ),
        (
            '{"status":"success","last_success_at":"2026-04-24T07:30:00Z","checksum_present":true}',
            'Backup local sin retención segura disponible.',
        ),
    ],
)
def test_backup_health_manifest_adapter_requires_integrity_and_retention_fields(tmp_path, manifest_body, expected_summary):
    manifest = tmp_path / 'backup-health-partial.json'
    manifest.write_text(manifest_body, encoding='utf-8')

    snapshot = BackupHealthManifestAdapter(manifest_path=manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    module = payload['modules'][0]
    assert module['status'] == 'warn'
    assert module['severity'] == 'medium'
    assert module['summary'] == expected_summary
    assert payload['signals'][0]['freshness']['state'] == 'stale'
    _assert_no_sensitive_host_output(payload)


def test_backup_health_manifest_adapter_models_missing_or_unreadable_manifest(tmp_path):
    missing = BackupHealthManifestAdapter(manifest_path=tmp_path / 'missing.json').snapshot(now='2026-04-24T08:00:00Z')
    unreadable_manifest = tmp_path / 'backup-health-status.json'
    unreadable_manifest.write_text('{not-json', encoding='utf-8')
    unreadable = BackupHealthManifestAdapter(manifest_path=unreadable_manifest).snapshot(now='2026-04-24T08:00:00Z')

    payload = HealthcheckService.from_source_snapshots((missing, unreadable)).get_workspace()

    status_by_module = {module['summary']: module['status'] for module in payload['modules']}
    assert status_by_module == {
        'Fuente Healthcheck ausente o todavía no configurada.': 'not_configured',
        'Fuente Healthcheck no legible; no se expone salida cruda.': 'unknown',
    }
    _assert_no_sensitive_host_output(payload)


def test_project_health_manifest_adapter_maps_clean_synced_workspace_to_safe_pass(tmp_path):
    manifest = tmp_path / 'project-health-status.json'
    manifest.write_text(
        '{"status":"success","updated_at":"2026-04-24T07:30:00Z","workspace_clean":true,"main_branch":true,"remote_synced":true,"branch":"main","remote_url":"git@github.com:private/repo.git","git_diff":"diff --git a/.env b/.env","untracked_files":[".env"],"stdout":"token secret raw_output"}',
        encoding='utf-8',
    )

    snapshot = ProjectHealthManifestAdapter(manifest_path=manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    assert payload['modules'] == [
        {
            'module_id': 'project-health',
            'label': 'Project health',
            'status': 'pass',
            'severity': 'low',
            'updated_at': '2026-04-24T07:30:00Z',
            'summary': 'Repo local revisado recientemente sin incidencias visibles.',
        }
    ]
    assert payload['signals'] == []
    _assert_no_sensitive_host_output(payload)


@pytest.mark.parametrize(
    ('manifest_body', 'expected_summary'),
    [
        (
            '{"status":"success","updated_at":"2026-04-24T07:30:00Z","workspace_clean":false,"main_branch":true,"remote_synced":true,"untracked_files":[".env"],"git_diff":"secret diff"}',
            'Repo local con cambios pendientes según manifiesto seguro.',
        ),
        (
            '{"status":"success","updated_at":"2026-04-24T07:30:00Z","workspace_clean":true,"main_branch":false,"remote_synced":true,"branch":"feature/private"}',
            'Repo local fuera de la rama estable esperada.',
        ),
        (
            '{"status":"success","updated_at":"2026-04-24T07:30:00Z","workspace_clean":true,"main_branch":true,"remote_synced":false,"remote_url":"git@github.com:private/repo.git"}',
            'Repo local pendiente de sincronización remota según manifiesto seguro.',
        ),
    ],
)
def test_project_health_manifest_adapter_degrades_unsafe_repo_states_without_leaking_details(tmp_path, manifest_body, expected_summary):
    manifest = tmp_path / 'project-health-status.json'
    manifest.write_text(manifest_body, encoding='utf-8')

    snapshot = ProjectHealthManifestAdapter(manifest_path=manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    module = payload['modules'][0]
    assert module['status'] == 'warn'
    assert module['severity'] == 'medium'
    assert module['summary'] == expected_summary
    assert payload['signals'][0]['check_id'] == 'project-health.workspace'
    assert payload['signals'][0]['freshness']['state'] == 'stale'
    _assert_no_sensitive_host_output(payload)


@pytest.mark.parametrize(
    'manifest_body',
    [
        '{"updated_at":"2026-04-24T07:30:00Z","workspace_clean":true,"main_branch":true,"remote_synced":true}',
        '{"status":"green","updated_at":"2026-04-24T07:30:00Z","workspace_clean":true,"main_branch":true,"remote_synced":true}',
        '{"status":"success","updated_at":"2026-04-24T07:30:00Z","main_branch":true,"remote_synced":true}',
    ],
)
def test_project_health_manifest_adapter_requires_explicit_safe_result_and_booleans(tmp_path, manifest_body):
    manifest = tmp_path / 'project-health-partial.json'
    manifest.write_text(manifest_body, encoding='utf-8')

    snapshot = ProjectHealthManifestAdapter(manifest_path=manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    module = payload['modules'][0]
    assert module['status'] == 'warn'
    assert module['severity'] == 'medium'
    assert module['summary'] == 'Repo local sin estado seguro completo disponible.'
    assert payload['signals'][0]['freshness']['state'] == 'stale'
    _assert_no_sensitive_host_output(payload)


def test_project_health_manifest_adapter_models_stale_missing_or_unreadable_manifest(tmp_path):
    stale_manifest = tmp_path / 'project-health-stale.json'
    stale_manifest.write_text(
        '{"status":"success","updated_at":"2026-04-23T23:00:00Z","workspace_clean":true,"main_branch":true,"remote_synced":true}',
        encoding='utf-8',
    )
    missing = ProjectHealthManifestAdapter(manifest_path=tmp_path / 'missing.json').snapshot(now='2026-04-24T08:00:00Z')
    unreadable_manifest = tmp_path / 'project-health-status.json'
    unreadable_manifest.write_text('{not-json', encoding='utf-8')
    unreadable = ProjectHealthManifestAdapter(manifest_path=unreadable_manifest).snapshot(now='2026-04-24T08:00:00Z')
    stale = ProjectHealthManifestAdapter(manifest_path=stale_manifest).snapshot(now='2026-04-24T08:00:00Z')

    payload = HealthcheckService.from_source_snapshots((missing, unreadable, stale)).get_workspace()

    status_by_summary = {module['summary']: module['status'] for module in payload['modules']}
    assert status_by_summary == {
        'Fuente Healthcheck ausente o todavía no configurada.': 'not_configured',
        'Fuente Healthcheck no legible; no se expone salida cruda.': 'unknown',
        'Repo local stale según manifiesto seguro.': 'stale',
    }
    _assert_no_sensitive_host_output(payload)


def test_cronjobs_manifest_adapter_maps_recent_successful_registry_to_safe_pass(tmp_path):
    manifest = tmp_path / 'cronjobs-status.json'
    manifest.write_text(
        '{"status":"success","updated_at":"2026-04-24T07:55:00Z","jobs":[{"name":"vault-sync","owner_profile":"franky","expected_cadence_minutes":60,"last_run_at":"2026-04-24T07:30:00Z","last_status":"success","criticality":"critical","prompt_body":"token secret","command":"cat /srv/crew-core/.env","chat_id":"synthetic-chat"},{"name":"project-health","owner_profile":"zoro","expected_cadence_minutes":120,"last_run_at":"2026-04-24T07:20:00Z","last_status":"success","criticality":"normal"}]}',
        encoding='utf-8',
    )

    snapshot = CronjobsManifestAdapter(manifest_path=manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    assert payload['modules'] == [
        {
            'module_id': 'cronjobs',
            'label': 'Cronjobs',
            'status': 'pass',
            'severity': 'low',
            'updated_at': '2026-04-24T07:55:00Z',
            'summary': 'Cronjobs críticos ejecutados recientemente según manifiesto seguro.',
        }
    ]
    assert payload['signals'] == []
    _assert_no_sensitive_host_output(payload)


@pytest.mark.parametrize(
    ('manifest_body', 'expected_status', 'expected_summary'),
    [
        (
            '{"status":"success","updated_at":"2026-04-24T07:55:00Z","jobs":[{"name":"vault-sync","last_run_at":"2026-04-24T07:30:00Z","last_status":"failed","criticality":"critical","stdout":"token secret"}]}',
            'fail',
            'Cronjob crítico reporta fallo según manifiesto seguro.',
        ),
        (
            '{"status":"success","updated_at":"2026-04-24T07:55:00Z","jobs":[{"name":"vault-sync","last_run_at":"2026-04-24T01:00:00Z","last_status":"success","criticality":"critical"}]}',
            'stale',
            'Cronjobs críticos stale según manifiesto seguro.',
        ),
        (
            '{"status":"success","updated_at":"2026-04-24T07:55:00Z","jobs":[{"name":"vault-sync","last_status":"success","criticality":"critical"}]}',
            'warn',
            'Cronjobs sin estado seguro completo disponible.',
        ),
    ],
)
def test_cronjobs_manifest_adapter_degrades_fail_stale_and_partial_jobs_without_leaking_details(tmp_path, manifest_body, expected_status, expected_summary):
    manifest = tmp_path / 'cronjobs-status.json'
    manifest.write_text(manifest_body, encoding='utf-8')

    snapshot = CronjobsManifestAdapter(manifest_path=manifest).snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    module = payload['modules'][0]
    assert module['status'] == expected_status
    assert module['summary'] == expected_summary
    assert payload['signals'][0]['check_id'] == 'cronjobs.registry'
    assert payload['signals'][0]['freshness']['state'] == 'stale'
    _assert_no_sensitive_host_output(payload)


def test_cronjobs_manifest_adapter_models_empty_missing_or_unreadable_registry(tmp_path):
    empty_manifest = tmp_path / 'cronjobs-empty.json'
    empty_manifest.write_text('{"status":"success","updated_at":"2026-04-24T07:55:00Z","jobs":[]}', encoding='utf-8')
    missing = CronjobsManifestAdapter(manifest_path=tmp_path / 'missing.json').snapshot(now='2026-04-24T08:00:00Z')
    unreadable_manifest = tmp_path / 'cronjobs-status.json'
    unreadable_manifest.write_text('{not-json', encoding='utf-8')
    unreadable = CronjobsManifestAdapter(manifest_path=unreadable_manifest).snapshot(now='2026-04-24T08:00:00Z')
    empty = CronjobsManifestAdapter(manifest_path=empty_manifest).snapshot(now='2026-04-24T08:00:00Z')

    payload = HealthcheckService.from_source_snapshots((missing, unreadable, empty)).get_workspace()

    status_by_summary = {module['summary']: module['status'] for module in payload['modules']}
    assert status_by_summary == {
        'Fuente Healthcheck ausente o todavía no configurada.': 'not_configured',
        'Fuente Healthcheck no legible; no se expone salida cruda.': 'unknown',
        'Cronjobs sin registro allowlisted disponible.': 'not_configured',
    }
    _assert_no_sensitive_host_output(payload)


def test_gateway_status_manifest_adapter_maps_all_active_gateways_to_safe_pass(tmp_path):
    manifest = tmp_path / 'gateway-status.json'
    manifest.write_text(
        '{"status":"success","updated_at":"2026-04-24T07:55:00Z","gateways":{"luffy":{"active":true,"pid":1234,"unit_content":"Environment=SYNTHETIC_TOKEN","journal":"secret raw_output"},"zoro":{"active":true},"nami":{"active":true},"usopp":{"active":true},"sanji":{"active":true},"chopper":{"active":true},"robin":{"active":true},"franky":{"active":true},"brook":{"active":true},"jinbe":{"active":true}}}',
        encoding='utf-8',
    )

    snapshots = GatewayStatusManifestAdapter(manifest_path=manifest).snapshots(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots(snapshots).get_workspace()

    assert len(payload['modules']) == 11
    assert {module['module_id'] for module in payload['modules']} == {
        'hermes-gateways',
        'gateway.luffy',
        'gateway.zoro',
        'gateway.nami',
        'gateway.usopp',
        'gateway.sanji',
        'gateway.chopper',
        'gateway.robin',
        'gateway.franky',
        'gateway.brook',
        'gateway.jinbe',
    }
    assert all(module['status'] == 'pass' for module in payload['modules'])
    assert payload['signals'] == []
    _assert_no_sensitive_host_output(payload)


def test_gateway_status_manifest_adapter_degrades_inactive_and_partial_gateways_without_leaking_details(tmp_path):
    manifest = tmp_path / 'gateway-status.json'
    manifest.write_text(
        '{"status":"success","updated_at":"2026-04-24T07:55:00Z","gateways":{"luffy":{"active":true},"zoro":{"active":false,"command":"cat /srv/crew-core/.env","stdout":"token secret"},"nami":{"active":true}}}',
        encoding='utf-8',
    )

    snapshots = GatewayStatusManifestAdapter(manifest_path=manifest).snapshots(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots(snapshots).get_workspace()

    status_by_module = {module['module_id']: module['status'] for module in payload['modules']}
    assert status_by_module['hermes-gateways'] == 'fail'
    assert status_by_module['gateway.luffy'] == 'pass'
    assert status_by_module['gateway.zoro'] == 'fail'
    assert status_by_module['gateway.franky'] == 'not_configured'
    assert {'hermes-gateways.global', 'gateway.zoro.process', 'gateway.franky.process'}.issubset(
        {signal['check_id'] for signal in payload['signals']}
    )
    _assert_no_sensitive_host_output(payload)


def test_gateway_status_manifest_adapter_models_stale_missing_or_unreadable_manifest(tmp_path):
    stale_manifest = tmp_path / 'gateway-status-stale.json'
    stale_manifest.write_text(
        '{"status":"success","updated_at":"2026-04-24T06:45:00Z","gateways":{"zoro":{"active":true}}}',
        encoding='utf-8',
    )
    missing = GatewayStatusManifestAdapter(manifest_path=tmp_path / 'missing.json').snapshots(now='2026-04-24T08:00:00Z')
    unreadable_manifest = tmp_path / 'gateway-status.json'
    unreadable_manifest.write_text('{not-json', encoding='utf-8')
    unreadable = GatewayStatusManifestAdapter(manifest_path=unreadable_manifest).snapshots(now='2026-04-24T08:00:00Z')
    stale = GatewayStatusManifestAdapter(manifest_path=stale_manifest).snapshots(now='2026-04-24T08:00:00Z')

    missing_payload = HealthcheckService.from_source_snapshots(missing).get_workspace()
    unreadable_payload = HealthcheckService.from_source_snapshots(unreadable).get_workspace()
    stale_payload = HealthcheckService.from_source_snapshots(stale).get_workspace()

    assert {module['status'] for module in missing_payload['modules']} == {'not_configured'}
    assert {module['status'] for module in unreadable_payload['modules']} == {'unknown'}
    assert next(module for module in stale_payload['modules'] if module['module_id'] == 'gateway.zoro')['status'] == 'stale'
    assert next(module for module in stale_payload['modules'] if module['module_id'] == 'hermes-gateways')['status'] == 'stale'
    _assert_no_sensitive_host_output(missing_payload)
    _assert_no_sensitive_host_output(unreadable_payload)
    _assert_no_sensitive_host_output(stale_payload)


def test_healthcheck_returns_sanitized_workspace():
    response = client.get('/api/v1/healthcheck')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'healthcheck.workspace'
    assert payload['status'] == 'ready'
    assert payload['meta']['read_only'] is True
    assert payload['meta']['sanitized'] is True
    assert payload['meta']['source'] == 'backend-owned-safe-catalog'

    data = payload['data']
    assert data['summary_bar']['checks_total'] == len(data['modules'])
    assert data['summary_bar']['warnings'] >= 0
    assert data['summary_bar']['incidents'] >= 0
    assert data['modules']
    assert data['operational_checks']
    assert [check['check_id'] for check in data['operational_checks']] == [
        'gateways',
        'honcho',
        'docker_runtime',
        'cronjobs',
        'vault_sync',
        'backup',
    ]
    assert data['events']
    assert isinstance(data['signals'], list)
    gateways = next(check for check in data['operational_checks'] if check['check_id'] == 'gateways')
    assert gateways['metric_label'] == 'Gateways activos'
    assert '/' in gateways['metric_value']
    assert 'gateways activos' in gateways['display_text']
    vault_sync = next(check for check in data['operational_checks'] if check['check_id'] == 'vault_sync')
    assert vault_sync['links'] == [{'label': 'Repo vault', 'href': 'https://github.com/asistentes-mugiwara/vault'}]
    assert 'Último correcto' in vault_sync['display_text']
    assert {'Repo público', 'Deny by default', 'Sin shell remoto'}.issubset(set(data['principles']))
    _assert_no_sensitive_host_output(payload)


def test_healthcheck_empty_source_is_not_configured():
    service = HealthcheckService(records=())

    assert service.workspace_status() == 'not_configured'
    workspace = service.get_workspace()
    assert workspace['summary_bar']['checks_total'] == 0
    assert workspace['summary_bar']['current_cause'] is None
    assert workspace['modules'] == []
    assert workspace['events'] == []
    assert workspace['signals'] == []
    assert [check['check_id'] for check in workspace['operational_checks']] == [
        'gateways',
        'honcho',
        'docker_runtime',
        'cronjobs',
        'vault_sync',
        'backup',
    ]
    assert all(check['status'] in {'not_configured', 'unknown'} for check in workspace['operational_checks'])
    assert all(check['display_text'] for check in workspace['operational_checks'])
    assert next(check for check in workspace['operational_checks'] if check['check_id'] == 'cronjobs')['metric_value'] == '0/0'
    assert list(next(check for check in workspace['operational_checks'] if check['check_id'] == 'honcho')['facts']) == [
        {'label': 'API', 'value': 'Sin manifiesto'},
        {'label': 'DB', 'value': 'Sin manifiesto'},
        {'label': 'Redis', 'value': 'Sin manifiesto'},
    ]


def test_healthcheck_operational_check_contract_exposes_safe_counters_and_failures():
    service = HealthcheckService(
        records=(
            _record('gateway.luffy', 'Luffy gateway', 'pass', 'low', '2026-04-24T07:45:00Z'),
            _record('gateway.zoro', 'Zoro gateway', 'fail', 'high', '2026-04-24T07:44:00Z'),
            _record('cronjobs', 'Cronjobs', 'warn', 'medium', '2026-04-24T07:41:00Z'),
            _record('vault-sync', 'Vault sync', 'pass', 'low', '2026-04-24T07:40:00Z'),
            _record('backup-health', 'Backup', 'pass', 'low', '2026-04-24T07:35:00Z'),
        )
    )

    workspace = service.get_workspace()
    gateways = next(check for check in workspace['operational_checks'] if check['check_id'] == 'gateways')
    assert gateways['metric_value'].endswith('/10')
    assert 'fallo en: Zoro' in gateways['display_text']
    assert list(gateways['failing_items']) == [{'id': 'zoro', 'label': 'Zoro', 'status': 'fail'}]

    backup = next(check for check in workspace['operational_checks'] if check['check_id'] == 'backup')
    assert backup['metric_label'] == 'Último backup válido'
    assert backup['metric_value'] == '2026-04-24T07:35:00Z'
    assert 'Drive' in backup['display_text']
    _assert_no_sensitive_host_output(workspace)


def test_healthcheck_router_builds_live_service_per_request():
    first = get_healthcheck_service()
    second = get_healthcheck_service()

    assert isinstance(first, HealthcheckService)
    assert isinstance(second, HealthcheckService)
    assert first is not second


def test_healthcheck_current_cause_is_derived_from_current_records_not_historical_events():
    service = HealthcheckService(
        records=(
            _record('project-health', 'Project health', 'warn', 'medium', '2026-04-24T07:30:00Z'),
            _record('hermes-gateways', 'Gateways', 'pass', 'low', '2026-04-24T07:45:00Z'),
        ),
        events=(
            # Historical fail must remain visible in bitacora but cannot become the current cause.
            _record_event('evt-old-gateway-fail', 'gateway.zoro', 'fail', '2026-04-23T07:39:00Z'),
        ),
    )

    payload = service.get_workspace()

    assert payload['summary_bar']['overall_status'] == 'warn'
    assert payload['summary_bar']['incidents'] == 0
    assert payload['summary_bar']['current_cause'] == {
        'source_id': 'project-health',
        'label': 'Project health',
        'status': 'warn',
        'severity': 'medium',
        'summary': 'Project health safe summary',
        'warning_text': 'Synthetic safe warning.',
        'freshness_state': 'fresh',
    }
    assert payload['events'][0]['kind'] == 'historical'
    assert payload['events'][0]['status'] == 'fail'
    _assert_no_sensitive_host_output(payload)


def test_healthcheck_pass_state_has_no_current_cause_even_with_historical_warning():
    service = HealthcheckService(
        records=(
            _record('project-health', 'Project health', 'pass', 'low', '2026-04-24T07:30:00Z'),
            _record('hermes-gateways', 'Gateways', 'pass', 'low', '2026-04-24T07:45:00Z'),
        ),
        events=(_record_event('evt-old-warning', 'cronjobs', 'warn', '2026-04-23T01:33:40+02:00'),),
    )

    payload = service.get_workspace()

    assert payload['summary_bar']['overall_status'] == 'pass'
    assert payload['summary_bar']['warnings'] == 0
    assert payload['summary_bar']['incidents'] == 0
    assert payload['summary_bar']['current_cause'] is None
    assert payload['events'][0]['kind'] == 'historical'


def test_healthcheck_degraded_source_state_is_visible(tmp_path):
    snapshot = BackupHealthManifestAdapter(manifest_path=tmp_path / 'missing-backup-health-status.json').snapshot(now='2026-04-24T08:00:00Z')
    payload = HealthcheckService.from_source_snapshots((snapshot,)).get_workspace()

    assert any(module['status'] in {'stale', 'not_configured', 'unknown'} for module in payload['modules'])
    degraded_signal = next(signal for signal in payload['signals'] if signal['status'] in {'stale', 'not_configured', 'unknown'})
    assert degraded_signal['freshness']['label']
    assert degraded_signal['warning_text']


def test_healthcheck_uses_explicit_timestamp_parsing_for_latest_update():
    service = HealthcheckService(
        records=(
            # Lexically larger, but older once the +02:00 offset is parsed.
            _record('cronjobs', 'Local offset', 'warn', 'medium', '2026-04-24T09:00:00+02:00'),
            _record('backup-health', 'UTC latest', 'pass', 'low', '2026-04-24T07:30:00Z'),
        )
    )

    assert service.get_workspace()['summary_bar']['updated_at'] == '2026-04-24T07:30:00Z'


def test_healthcheck_invalid_timestamp_does_not_win_freshness_aggregation():
    service = HealthcheckService(
        records=(
            _record('cronjobs', 'Bad clock', 'warn', 'medium', 'not-a-timestamp'),
            _record('backup-health', 'Valid clock', 'pass', 'low', '2026-04-24T07:30:00Z'),
        )
    )

    assert service.get_workspace()['summary_bar']['updated_at'] == '2026-04-24T07:30:00Z'


def test_healthcheck_naive_timestamp_is_normalized_for_safe_comparison():
    service = HealthcheckService(
        records=(
            _record('cronjobs', 'Naive clock', 'warn', 'medium', '2026-04-24T07:45:00'),
            _record('backup-health', 'Aware clock', 'pass', 'low', '2026-04-24T07:30:00Z'),
        )
    )

    assert service.get_workspace()['summary_bar']['updated_at'] == '2026-04-24T07:45:00'


def test_dashboard_aggregates_safe_summaries():
    response = client.get('/api/v1/dashboard')

    assert response.status_code == 200
    payload = response.json()
    assert payload['resource'] == 'dashboard.summary'
    assert payload['status'] == 'ready'
    assert payload['meta']['read_only'] is True
    assert payload['meta']['sanitized'] is True
    assert payload['meta']['links_count'] == 5

    data = payload['data']
    section_ids = {section['id'] for section in data['sections']}
    assert section_ids == {'dashboard', 'healthcheck', 'mugiwaras', 'memory', 'vault', 'skills'}
    assert data['highest_severity'] in {'low', 'medium', 'high', 'critical'}
    assert data['freshness']['state'] in {'fresh', 'stale'}
    assert any(count['label'] == 'Checks con warning' for count in data['counts'])
    assert {'label': 'Abrir Healthcheck', 'href': '/healthcheck'} in data['links']
    _assert_no_sensitive_host_output(payload)


def test_dashboard_handles_unavailable_health_source_explicitly():
    dashboard = DashboardService(healthcheck_service=HealthcheckService(records=()))

    payload = dashboard.get_summary()
    health_section = next(section for section in payload['sections'] if section['id'] == 'healthcheck')
    assert health_section['status'] == 'warning'
    assert payload['freshness']['state'] == 'stale'
    assert any(count['label'] == 'Checks con warning' and count['value'] == 0 for count in payload['counts'])


def test_dashboard_uses_record_severity_for_critical_aggregation():
    healthcheck = HealthcheckService(
        records=(
            _record('cronjobs', 'Critical warning', 'warn', 'critical', '2026-04-24T07:30:00Z'),
            _record('backup-health', 'Failed high', 'fail', 'high', '2026-04-24T07:20:00Z'),
        )
    )
    dashboard = DashboardService(healthcheck_service=healthcheck)

    payload = dashboard.get_summary()

    assert payload['highest_severity'] == 'critical'
    assert {'label': 'Incidencias críticas', 'value': 1, 'note': 'sin salidas crudas'} in payload['counts']

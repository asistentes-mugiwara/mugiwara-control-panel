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
    HealthcheckRecord,
)
from apps.api.src.modules.healthcheck.registry import HealthcheckSourceRegistry
from apps.api.src.modules.healthcheck.source_adapters import VaultSyncManifestAdapter
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


def _assert_no_sensitive_host_output(value):
    forbidden = ('/srv/', '/home/', '.env', 'token', 'secret', 'password', 'raw_output', 'stdout', 'stderr', 'command')
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
    assert data['summary_bar']['warnings'] >= 1
    assert data['summary_bar']['incidents'] >= 0
    assert data['modules']
    assert data['events']
    assert data['signals']
    assert {'Repo público', 'Deny by default', 'Sin shell remoto'}.issubset(set(data['principles']))
    _assert_no_sensitive_host_output(payload)


def test_healthcheck_empty_source_is_not_configured():
    service = HealthcheckService(records=())

    assert service.workspace_status() == 'not_configured'
    assert service.get_workspace()['summary_bar']['checks_total'] == 0
    assert service.get_workspace()['modules'] == []
    assert service.get_workspace()['events'] == []
    assert service.get_workspace()['signals'] == []


def test_healthcheck_degraded_source_state_is_visible():
    payload = client.get('/api/v1/healthcheck').json()

    assert any(module['status'] in {'stale', 'not_configured', 'unknown'} for module in payload['data']['modules'])
    degraded_signal = next(signal for signal in payload['data']['signals'] if signal['status'] in {'stale', 'not_configured', 'unknown'})
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

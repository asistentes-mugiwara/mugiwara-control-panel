from __future__ import annotations

from ..healthcheck.service import HealthcheckService

_SEVERITY_RANK = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
_STATUS_TO_SECTION = {'pass': 'healthy', 'warn': 'warning', 'stale': 'warning', 'fail': 'degraded'}
_STATUS_TO_SEVERITY = {'pass': 'low', 'warn': 'medium', 'stale': 'medium', 'fail': 'high'}


class DashboardService:
    def __init__(self, *, healthcheck_service: HealthcheckService | None = None) -> None:
        self._healthcheck_service = healthcheck_service or HealthcheckService()

    def summary_status(self) -> str:
        return 'ready'

    def get_summary(self) -> dict:
        health_status = self._healthcheck_service.workspace_status()
        health = self._healthcheck_service.get_workspace()
        summary_bar = health['summary_bar']
        health_section_status = 'warning' if health_status != 'ready' else _STATUS_TO_SECTION.get(summary_bar['overall_status'], 'warning')
        highest = self._highest_severity(health)
        freshness_state = 'stale' if health_status != 'ready' or summary_bar['overall_status'] == 'stale' else 'fresh'
        updated_at = summary_bar['updated_at']
        freshness_label = 'Healthcheck backend no configurado' if health_status != 'ready' else 'Agregado backend actualizado'
        warnings = int(summary_bar['warnings']) if health_status == 'ready' else 0
        criticals = self._critical_incidents(health) if health_status == 'ready' else 0
        return {
            'sections': [
                {'id': 'dashboard', 'label': 'Dashboard', 'status': 'healthy'},
                {'id': 'healthcheck', 'label': 'Healthcheck', 'status': health_section_status},
                {'id': 'mugiwaras', 'label': 'Mugiwaras', 'status': 'healthy'},
                {'id': 'memory', 'label': 'Memory', 'status': 'warning'},
                {'id': 'vault', 'label': 'Vault', 'status': 'healthy'},
                {'id': 'skills', 'label': 'Skills', 'status': 'healthy'},
            ],
            'highest_severity': highest,
            'freshness': {'updated_at': updated_at, 'label': freshness_label, 'state': freshness_state},
            'counts': [
                {'label': 'Superficies monitorizadas', 'value': 6, 'note': 'lectura backend agregada'},
                {'label': 'Checks con warning', 'value': warnings, 'note': 'desde Healthcheck saneado'},
                {'label': 'Mugiwaras activos', 'value': 9, 'note': 'catálogo allowlisted'},
                {'label': 'Incidencias críticas', 'value': criticals, 'note': 'sin salidas crudas'},
            ],
            'links': [
                {'label': 'Abrir Healthcheck', 'href': '/healthcheck'},
                {'label': 'Abrir Mugiwaras', 'href': '/mugiwaras'},
                {'label': 'Abrir Memory', 'href': '/memory'},
                {'label': 'Abrir Vault', 'href': '/vault'},
                {'label': 'Abrir Skills', 'href': '/skills'},
            ],
        }

    def _highest_severity(self, health: dict) -> str:
        severities = [module.get('severity') or _STATUS_TO_SEVERITY.get(module['status'], 'medium') for module in health['modules']]
        ranked_severities = [severity for severity in severities if severity in _SEVERITY_RANK]
        if not ranked_severities:
            return 'medium'
        return max(ranked_severities, key=lambda severity: _SEVERITY_RANK[severity])

    def _critical_incidents(self, health: dict) -> int:
        return sum(1 for module in health['modules'] if module.get('severity') == 'critical')

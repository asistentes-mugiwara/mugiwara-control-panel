import type { AppStatus } from '@/shared/theme/tokens'

import type { DashboardFreshness, DashboardSeverity } from './dashboard-summary.fixture'

export function mapDashboardSeverityToStatus(severity: DashboardSeverity): AppStatus {
  const map: Record<DashboardSeverity, AppStatus> = {
    low: 'operativo',
    medium: 'revision',
    high: 'incidencia',
    critical: 'incidencia',
  }

  return map[severity]
}

export function mapDashboardFreshnessToStatus(freshness: DashboardFreshness): AppStatus {
  return freshness.state === 'stale' ? 'stale' : 'operativo'
}

export function getDashboardSeverityLabel(severity: DashboardSeverity): string {
  const map: Record<DashboardSeverity, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica',
  }

  return map[severity]
}

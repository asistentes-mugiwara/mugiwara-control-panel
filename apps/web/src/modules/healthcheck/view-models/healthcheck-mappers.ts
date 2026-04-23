import type { AppStatus } from '@/shared/theme/tokens'

import type { HealthcheckSeverity, HealthcheckStatus } from './healthcheck-summary.fixture'

export function mapHealthcheckStatusToBadgeStatus(status: HealthcheckStatus): AppStatus {
  const map: Record<HealthcheckStatus, AppStatus> = {
    pass: 'operativo',
    warn: 'revision',
    fail: 'incidencia',
    stale: 'stale',
  }

  return map[status]
}

export function mapHealthcheckSeverityToBadgeStatus(severity: HealthcheckSeverity): AppStatus {
  const map: Record<HealthcheckSeverity, AppStatus> = {
    low: 'operativo',
    medium: 'revision',
    high: 'incidencia',
    critical: 'incidencia',
  }

  return map[severity]
}

export function getHealthcheckStatusLabel(status: HealthcheckStatus): string {
  const map: Record<HealthcheckStatus, string> = {
    pass: 'Pass',
    warn: 'Warn',
    fail: 'Fail',
    stale: 'Stale',
  }

  return map[status]
}

export function getHealthcheckSeverityLabel(severity: HealthcheckSeverity): string {
  const map: Record<HealthcheckSeverity, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica',
  }

  return map[severity]
}

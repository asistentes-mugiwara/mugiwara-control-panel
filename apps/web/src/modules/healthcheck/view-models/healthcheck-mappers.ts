import type { AppStatus } from '@/shared/theme/tokens'

import type { HealthcheckSeverity, HealthcheckStatus } from './healthcheck-summary.fixture'

export function mapHealthcheckStatusToBadgeStatus(status: HealthcheckStatus): AppStatus {
  const map: Record<HealthcheckStatus, AppStatus> = {
    pass: 'operativo',
    warn: 'revision',
    fail: 'incidencia',
    stale: 'stale',
    not_configured: 'revision',
    unknown: 'sin-datos',
  }

  return map[status]
}

export function mapHealthcheckSeverityToBadgeStatus(severity: HealthcheckSeverity): AppStatus {
  const map: Record<HealthcheckSeverity, AppStatus> = {
    low: 'operativo',
    medium: 'revision',
    high: 'incidencia',
    critical: 'incidencia',
    unknown: 'sin-datos',
  }

  return map[severity]
}

export function getHealthcheckStatusLabel(status: HealthcheckStatus): string {
  const map: Record<HealthcheckStatus, string> = {
    pass: 'Operativo',
    warn: 'En revisión',
    fail: 'Incidencia',
    stale: 'Desactualizado',
    not_configured: 'Fuente no configurada',
    unknown: 'Estado desconocido',
  }

  return map[status]
}

export function getHealthcheckSeverityLabel(severity: HealthcheckSeverity): string {
  const map: Record<HealthcheckSeverity, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica',
    unknown: 'Desconocida',
  }

  return map[severity]
}


const statusTriageRank: Record<HealthcheckStatus, number> = {
  fail: 90,
  stale: 55,
  warn: 50,
  pass: 10,
  not_configured: 40,
  unknown: 35,
}

const severityTriageRank: Record<HealthcheckSeverity, number> = {
  critical: 100,
  high: 80,
  medium: 45,
  low: 5,
  unknown: 30,
}

export function getHealthcheckTriageRank(status: HealthcheckStatus, severity: HealthcheckSeverity): number {
  return Math.max(statusTriageRank[status], severityTriageRank[severity])
}

export function shouldRenderSeparateSeverityBadge(status: HealthcheckStatus, severity: HealthcheckSeverity): boolean {
  return mapHealthcheckStatusToBadgeStatus(status) !== mapHealthcheckSeverityToBadgeStatus(severity)
}

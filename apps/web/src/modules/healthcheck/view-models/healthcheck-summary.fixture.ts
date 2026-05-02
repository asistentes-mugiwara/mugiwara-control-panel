export type HealthcheckSeverity = 'low' | 'medium' | 'high' | 'critical' | 'unknown'
export type HealthcheckStatus = 'pass' | 'warn' | 'fail' | 'stale' | 'not_configured' | 'unknown'

export type HealthcheckFreshness = {
  updated_at: string | null
  label: string
  state?: 'fresh' | 'stale' | 'unknown'
}

export type HealthcheckCurrentCause = {
  source_id: string
  label: string
  status: HealthcheckStatus
  severity: HealthcheckSeverity
  summary: string
  warning_text: string | null
  freshness_state: 'fresh' | 'stale' | 'unknown'
}

export type HealthcheckSummaryBar = {
  overall_status: HealthcheckStatus
  checks_total: number
  warnings: number
  incidents: number
  updated_at: string | null
  current_cause: HealthcheckCurrentCause | null
}

export type HealthcheckModuleCard = {
  module_id: string
  label: string
  status: HealthcheckStatus
  severity: HealthcheckSeverity
  updated_at: string
  summary: string
}

export type HealthcheckFact = {
  label: string
  value: string
}

export type HealthcheckOperationalItem = {
  id: string
  label: string
  status: HealthcheckStatus
}

export type HealthcheckOperationalCheck = {
  check_id: 'gateways' | 'honcho' | 'docker_runtime' | 'cronjobs' | 'vault_sync' | 'backup' | string
  label: string
  status: HealthcheckStatus
  severity: HealthcheckSeverity
  updated_at: string | null
  summary: string
  freshness: HealthcheckFreshness
  display_text?: string
  metric_label?: string | null
  metric_value?: string | null
  failing_items?: HealthcheckOperationalItem[]
  items?: HealthcheckOperationalItem[]
  links?: Array<{ label: string; href: string }>
  facts?: HealthcheckFact[]
}

export type HealthcheckEvent = {
  event_id: string
  source: string
  status: HealthcheckStatus
  timestamp: string
  detail: string
  kind: 'historical'
}

export type HealthcheckSummaryItem = {
  check_id: string
  label: string
  severity: HealthcheckSeverity
  status: HealthcheckStatus
  freshness: HealthcheckFreshness
  warning_text: string
  source_label: string
}

export type HealthcheckWorkspace = {
  summary_bar: HealthcheckSummaryBar
  operational_checks: HealthcheckOperationalCheck[]
  modules: HealthcheckModuleCard[]
  events: HealthcheckEvent[]
  principles: string[]
  signals: HealthcheckSummaryItem[]
}

const operationalChecks: HealthcheckOperationalCheck[] = [
  {
    check_id: 'gateways',
    label: 'Gateways',
    status: 'warn',
    severity: 'medium',
    updated_at: '2026-04-24T07:44:00Z',
    summary: 'Gateway con advertencia operativa saneada en el último corte disponible.',
    freshness: { updated_at: '2026-04-24T07:44:00Z', label: 'Actualizado hace 2 min', state: 'stale' },
  },
  {
    check_id: 'honcho',
    label: 'Honcho',
    status: 'unknown',
    severity: 'unknown',
    updated_at: null,
    summary: 'Honcho no expone datos internos en Healthcheck; falta manifiesto operativo saneado.',
    freshness: { updated_at: null, label: 'Frescura desconocida', state: 'unknown' },
  },
  {
    check_id: 'docker_runtime',
    label: 'Docker runtime',
    status: 'unknown',
    severity: 'unknown',
    updated_at: null,
    summary: 'Docker runtime no expone detalles internos; falta manifiesto operativo saneado.',
    freshness: { updated_at: null, label: 'Frescura desconocida', state: 'unknown' },
  },
  {
    check_id: 'cronjobs',
    label: 'Cronjobs',
    status: 'warn',
    severity: 'medium',
    updated_at: '2026-04-24T07:41:00Z',
    summary: 'La revisión nocturna ejecutó, pero queda una advertencia operativa menor en skills del job.',
    freshness: { updated_at: '2026-04-24T07:41:00Z', label: 'Actualizado hace 5 min', state: 'stale' },
  },
  {
    check_id: 'vault_sync',
    label: 'Vault sync',
    status: 'stale',
    severity: 'medium',
    updated_at: '2026-04-24T07:22:00Z',
    summary: 'Parte del estado documental está disponible, pero algunos resúmenes necesitan refresco.',
    freshness: { updated_at: '2026-04-24T07:22:00Z', label: 'Actualizado hace 24 min', state: 'stale' },
  },
  {
    check_id: 'backup',
    label: 'Backup',
    status: 'pass',
    severity: 'low',
    updated_at: '2026-04-24T07:35:00Z',
    summary: 'Último backup local completado y checksum disponible.',
    freshness: { updated_at: '2026-04-24T07:35:00Z', label: 'Actualizado hace 11 min', state: 'fresh' },
  },
]

export const healthcheckWorkspaceFixture: HealthcheckWorkspace = {
  summary_bar: {
    overall_status: 'stale',
    checks_total: 6,
    warnings: 4,
    incidents: 0,
    updated_at: '2026-04-24T07:46:00Z',
    current_cause: {
      source_id: 'vault-sync',
      label: 'Vault sync',
      status: 'stale',
      severity: 'medium',
      summary: 'Parte del estado documental está disponible, pero algunos resúmenes necesitan refresco.',
      warning_text: 'Causa principal del snapshot saneado; no representa lectura real.',
      freshness_state: 'stale',
    },
  },
  operational_checks: operationalChecks,
  modules: operationalChecks.map((check) => ({
    module_id: check.check_id,
    label: check.label,
    status: check.status,
    severity: check.severity,
    updated_at: check.updated_at ?? '',
    summary: check.summary,
  })),
  events: [],
  principles: [
    'Repo público',
    'Deny by default',
    'Allowlists explícitas',
    'Sin acceso arbitrario al host',
  ],
  signals: operationalChecks
    .filter((check) => check.status !== 'pass')
    .map((check) => ({
      check_id: check.check_id,
      label: check.label,
      severity: check.severity,
      status: check.status,
      freshness: check.freshness,
      warning_text: check.summary,
      source_label: 'Healthcheck fallback saneado',
    })),
}

export const healthcheckSummaryFixture: HealthcheckSummaryItem[] = healthcheckWorkspaceFixture.signals

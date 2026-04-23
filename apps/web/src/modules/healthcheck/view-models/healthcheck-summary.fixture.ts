export type HealthcheckSeverity = 'low' | 'medium' | 'high' | 'critical'
export type HealthcheckStatus = 'pass' | 'warn' | 'fail' | 'stale'

export type HealthcheckFreshness = {
  updated_at: string
  label: string
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

export const healthcheckSummaryFixture: HealthcheckSummaryItem[] = [
  {
    check_id: 'api-gateway-latency',
    label: 'API gateway latency',
    severity: 'medium',
    status: 'warn',
    freshness: {
      updated_at: '2026-04-23T14:44:00Z',
      label: 'Actualizado hace 4 min',
    },
    warning_text: 'Latencia por encima del umbral recomendado.',
    source_label: 'Gateway monitor',
  },
  {
    check_id: 'memory-sync-window',
    label: 'Memory sync window',
    severity: 'low',
    status: 'pass',
    freshness: {
      updated_at: '2026-04-23T14:43:00Z',
      label: 'Actualizado hace 5 min',
    },
    warning_text: 'Sin alerta activa.',
    source_label: 'Memory coordinator',
  },
  {
    check_id: 'vault-index-refresh',
    label: 'Vault index refresh',
    severity: 'medium',
    status: 'stale',
    freshness: {
      updated_at: '2026-04-23T14:31:00Z',
      label: 'Actualizado hace 17 min',
    },
    warning_text: 'Índice desactualizado, pendiente de ciclo regular.',
    source_label: 'Vault index service',
  },
]

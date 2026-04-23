export type HealthcheckSeverity = 'low' | 'medium' | 'high' | 'critical'
export type HealthcheckStatus = 'pass' | 'warn' | 'fail' | 'stale'

export type HealthcheckFreshness = {
  updated_at: string
  label: string
}

export type HealthcheckSummaryBar = {
  overall_status: HealthcheckStatus
  checks_total: number
  warnings: number
  incidents: number
  updated_at: string
}

export type HealthcheckModuleCard = {
  module_id: string
  label: string
  status: HealthcheckStatus
  severity: HealthcheckSeverity
  updated_at: string
  summary: string
}

export type HealthcheckEvent = {
  event_id: string
  source: string
  status: HealthcheckStatus
  timestamp: string
  detail: string
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
  modules: HealthcheckModuleCard[]
  events: HealthcheckEvent[]
  principles: string[]
  signals: HealthcheckSummaryItem[]
}

export const healthcheckWorkspaceFixture: HealthcheckWorkspace = {
  summary_bar: {
    overall_status: 'warn',
    checks_total: 6,
    warnings: 2,
    incidents: 1,
    updated_at: '2026-04-24T07:46:00Z',
  },
  modules: [
    {
      module_id: 'cronjobs',
      label: 'Cronjobs',
      status: 'warn',
      severity: 'medium',
      updated_at: '2026-04-24T07:41:00Z',
      summary: 'La revisión nocturna ejecutó, pero queda una advertencia operativa menor en skills del job.',
    },
    {
      module_id: 'backups',
      label: 'Backups',
      status: 'pass',
      severity: 'low',
      updated_at: '2026-04-24T07:35:00Z',
      summary: 'Último backup local completado y checksum disponible.',
    },
    {
      module_id: 'gateways',
      label: 'Gateways',
      status: 'warn',
      severity: 'medium',
      updated_at: '2026-04-24T07:44:00Z',
      summary: 'Latencia por encima del umbral recomendado en la puerta principal.',
    },
    {
      module_id: 'honcho',
      label: 'Honcho',
      status: 'stale',
      severity: 'medium',
      updated_at: '2026-04-24T07:22:00Z',
      summary: 'Parte del contexto relacional está disponible, pero algunos resúmenes necesitan refresco.',
    },
    {
      module_id: 'docker',
      label: 'Docker',
      status: 'pass',
      severity: 'low',
      updated_at: '2026-04-24T07:32:00Z',
      summary: 'Servicios contenedorizados sin incidencias visibles en este corte.',
    },
    {
      module_id: 'system',
      label: 'System',
      status: 'fail',
      severity: 'high',
      updated_at: '2026-04-24T07:39:00Z',
      summary: 'Se detectó una incidencia abierta de capacidad que requiere revisión prioritaria.',
    },
  ],
  events: [
    {
      event_id: 'evt-cron-nightly',
      source: 'cronjobs',
      status: 'warn',
      timestamp: '2026-04-24T01:33:40+02:00',
      detail: 'Ejecución nocturna completada con salida OK, pero quedaron referencias de skills a normalizar.',
    },
    {
      event_id: 'evt-gateway-latency',
      source: 'gateways',
      status: 'warn',
      timestamp: '2026-04-24T07:44:00Z',
      detail: 'Latencia sostenida por encima del umbral objetivo durante la última ventana de observación.',
    },
    {
      event_id: 'evt-system-capacity',
      source: 'system',
      status: 'fail',
      timestamp: '2026-04-24T07:39:00Z',
      detail: 'Capacidad degradada en un componente del host; se ha marcado como incidencia para revisión.',
    },
    {
      event_id: 'evt-backup-checksum',
      source: 'backups',
      status: 'pass',
      timestamp: '2026-04-24T07:35:00Z',
      detail: 'Backup reciente validado con checksum sin desviaciones.',
    },
  ],
  principles: [
    'Repo público',
    'Deny by default',
    'Allowlists explícitas',
    'Sin acceso arbitrario al host',
  ],
  signals: [
    {
      check_id: 'api-gateway-latency',
      label: 'API gateway latency',
      severity: 'medium',
      status: 'warn',
      freshness: {
        updated_at: '2026-04-24T07:44:00Z',
        label: 'Actualizado hace 2 min',
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
        updated_at: '2026-04-24T07:43:00Z',
        label: 'Actualizado hace 3 min',
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
        updated_at: '2026-04-24T07:22:00Z',
        label: 'Actualizado hace 24 min',
      },
      warning_text: 'Índice desactualizado, pendiente de ciclo regular.',
      source_label: 'Vault index service',
    },
  ],
}

export const healthcheckSummaryFixture: HealthcheckSummaryItem[] = healthcheckWorkspaceFixture.signals

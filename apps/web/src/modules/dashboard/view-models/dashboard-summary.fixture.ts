export type DashboardSeverity = 'low' | 'medium' | 'high' | 'critical'

export type DashboardSection = {
  id: 'dashboard' | 'healthcheck' | 'mugiwaras' | 'memory' | 'vault' | 'skills'
  label: string
  status: 'healthy' | 'warning' | 'degraded'
}

export type DashboardFreshness = {
  updated_at: string
  label: string
  state: 'fresh' | 'stale'
}

export type DashboardCount = {
  label: string
  value: number
  note: string
}

export type DashboardLink = {
  label: string
  href: '/mugiwaras' | '/skills' | '/memory' | '/vault' | '/healthcheck'
}

export type DashboardSummary = {
  sections: DashboardSection[]
  highest_severity: DashboardSeverity
  freshness: DashboardFreshness
  counts: DashboardCount[]
  links: DashboardLink[]
}

export const dashboardSummaryFixture: DashboardSummary = {
  sections: [
    { id: 'dashboard', label: 'Dashboard', status: 'healthy' },
    { id: 'healthcheck', label: 'Healthcheck', status: 'warning' },
    { id: 'mugiwaras', label: 'Mugiwaras', status: 'healthy' },
    { id: 'memory', label: 'Memory', status: 'warning' },
    { id: 'vault', label: 'Vault', status: 'healthy' },
    { id: 'skills', label: 'Skills', status: 'healthy' },
  ],
  highest_severity: 'medium',
  freshness: {
    updated_at: '2026-04-23T14:45:00Z',
    label: 'Actualizado hace 3 min',
    state: 'fresh',
  },
  counts: [
    { label: 'Superficies monitorizadas', value: 6, note: 'lectura activa' },
    { label: 'Checks con warning', value: 2, note: 'sin incidencia crítica' },
    { label: 'Mugiwaras activos', value: 9, note: 'sin bloqueos globales' },
    { label: 'Incidencias críticas', value: 0, note: 'estado estable' },
  ],
  links: [
    { label: 'Abrir Healthcheck', href: '/healthcheck' },
    { label: 'Abrir Mugiwaras', href: '/mugiwaras' },
    { label: 'Abrir Memory', href: '/memory' },
    { label: 'Abrir Vault', href: '/vault' },
    { label: 'Abrir Skills', href: '/skills' },
  ],
}

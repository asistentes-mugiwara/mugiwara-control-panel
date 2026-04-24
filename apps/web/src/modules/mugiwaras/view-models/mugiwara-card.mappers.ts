import type { Severity } from '@contracts/read-models'

import type { AppStatus } from '@/shared/theme/tokens'

export function mapMugiwaraStatusToBadgeStatus(status: Severity): AppStatus {
  const map: Record<Severity, AppStatus> = {
    operativo: 'operativo',
    revision: 'revision',
    incidencia: 'incidencia',
    stale: 'stale',
    'sin-datos': 'sin-datos',
  }

  return map[status]
}

export function getMugiwaraStatusLabel(status: Severity): string {
  const map: Record<Severity, string> = {
    operativo: 'Operativo',
    revision: 'En revisión',
    incidencia: 'Incidencia',
    stale: 'Stale',
    'sin-datos': 'Sin datos',
  }

  return map[status]
}

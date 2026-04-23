import type { AppStatus } from '@/shared/theme/tokens'

import type { MugiwaraCardStatus } from './mugiwara-card.fixture'

export function mapMugiwaraStatusToBadgeStatus(status: MugiwaraCardStatus): AppStatus {
  const map: Record<MugiwaraCardStatus, AppStatus> = {
    healthy: 'operativo',
    warning: 'revision',
    degraded: 'incidencia',
  }

  return map[status]
}

export function getMugiwaraStatusLabel(status: MugiwaraCardStatus): string {
  const map: Record<MugiwaraCardStatus, string> = {
    healthy: 'Estable',
    warning: 'Atención',
    degraded: 'Degradado',
  }

  return map[status]
}

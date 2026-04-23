import type { AppStatus } from '@/shared/theme/tokens'

import type { SkillExposureMode, SkillSurfaceCardStatus } from './skill-surface.fixture'

export function mapSkillSurfaceStatusToBadgeStatus(status: SkillSurfaceCardStatus): AppStatus {
  switch (status) {
    case 'warning':
      return 'revision'
    case 'degraded':
      return 'incidencia'
    case 'healthy':
    default:
      return 'operativo'
  }
}

export function getSkillExposureLabel(exposure: SkillExposureMode) {
  return exposure === 'allowlisted-edit' ? 'Editable por allowlist' : 'Solo referencia read-only'
}

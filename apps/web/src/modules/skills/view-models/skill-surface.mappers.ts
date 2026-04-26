import type { SkillCatalogItem, SkillDetail } from '@contracts/skills'

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
  return exposure === 'allowlisted-edit' ? 'Editable por allowlist' : 'Solo referencia de lectura'
}

export function mapRiskToBadgeStatus(risk: SkillCatalogItem['public_repo_risk']): AppStatus {
  switch (risk) {
    case 'high':
      return 'incidencia'
    case 'medium':
      return 'revision'
    case 'low':
    default:
      return 'operativo'
  }
}

export function mapCatalogSkillToBadgeStatus(skill: Pick<SkillCatalogItem | SkillDetail, 'editable' | 'public_repo_risk'>): AppStatus {
  if (!skill.editable) {
    return 'revision'
  }

  return mapRiskToBadgeStatus(skill.public_repo_risk)
}

export function mapSkillsViewStateToBadgeStatus(state: 'loading' | 'ready' | 'empty' | 'error' | 'not_configured'): AppStatus {
  switch (state) {
    case 'ready':
      return 'operativo'
    case 'empty':
      return 'sin-datos'
    case 'not_configured':
      return 'revision'
    case 'error':
      return 'incidencia'
    case 'loading':
    default:
      return 'revision'
  }
}

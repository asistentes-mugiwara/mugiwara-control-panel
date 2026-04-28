import type { ResourceEnvelope } from './resource'

export type SkillOwnerScope = 'agent' | 'shared' | 'runtime'
export type PublicRepoRisk = 'low' | 'medium' | 'high'

export type SkillCatalogItem = {
  skill_id: string
  display_name: string
  owner_scope: SkillOwnerScope
  owner_slug: string
  owner_label: string
  public_repo_risk: PublicRepoRisk
  editable: boolean
  repo_path: string
}

export type SkillFingerprint = {
  sha256: string
  bytes: number
}

export type SkillDiffSummary = {
  lines_added: number
  lines_removed: number
  hunks: number
  preview: string[]
  truncated: boolean
}

export type SkillAuditRecord = {
  timestamp: string
  actor: string
  skill_id: string
  repo_path: string
  before_sha256: string
  after_sha256: string
  diff_summary: SkillDiffSummary
  result: 'success' | 'rejected' | 'failed'
  reason: string | null
}

export type SkillDetail = SkillCatalogItem & {
  content: string
  fingerprint: SkillFingerprint
}

export type SkillsCatalogResponse = ResourceEnvelope<{ items: SkillCatalogItem[] }, { count: number; editable_count: number }>
export type SkillDetailResponse = ResourceEnvelope<SkillDetail, { editable: boolean; skill_id: string }>
export type SkillPreviewResponse = ResourceEnvelope<{
  skill_id: string
  repo_path: string
  before: SkillFingerprint
  after: SkillFingerprint
  diff_summary: SkillDiffSummary
}, { skill_id: string }>
export type SkillUpdateResponse = ResourceEnvelope<{ skill: SkillDetail; audit: SkillAuditRecord }, { skill_id: string; actor: string }>
export type SkillAuditResponse = ResourceEnvelope<{ items: SkillAuditRecord[] }, { count: number }>

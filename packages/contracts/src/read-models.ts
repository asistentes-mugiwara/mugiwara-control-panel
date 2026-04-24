import type { ResourceEnvelope } from './resource'

export type Freshness = {
  status: 'fresh' | 'stale' | 'unknown'
  updated_at: string | null
  source_label?: string
}

export type SafeLink = {
  label: string
  href: string
}

export type Severity = 'operativo' | 'revision' | 'incidencia' | 'stale' | 'sin-datos'

export type DashboardSection = {
  section_id: string
  label: string
  status: Severity
  summary: string
  href?: string
}

export type DashboardSummary = {
  sections: DashboardSection[]
  highest_severity: Severity
  freshness: Freshness
  counts: Record<string, number>
  links: SafeLink[]
}

export type MugiwaraCard = {
  slug: string
  name: string
  status: Severity
  skills: string[]
  memory_badge: string
  links: SafeLink[]
}

export type CrewRulesDocument = {
  document_id: string
  title: string
  display_path: string
  source_label: string
  read_only: true
  canonical: true
  markdown: string
}

export type MugiwaraProfile = {
  slug: string
  identity: {
    name: string
    role: string
    crest_src: string
    accent_color: string
  }
  status: Severity
  allowed_metadata: Record<string, string | number | boolean | null>
  linked_skills: string[]
  memory_summary: string
}

export type MemoryAgentSummary = {
  mugiwara_slug: string
  summary: string
  fact_count: number
  last_updated: string | null
  badges: string[]
}

export type MemoryAgentDetail = {
  mugiwara_slug: string
  built_in_summary: string
  honcho_facts: string[]
  freshness: Freshness
  links: SafeLink[]
}

export type VaultIndex = {
  path: string
  entries: Array<{
    name: string
    path: string
    kind: 'directory' | 'document'
  }>
  breadcrumbs: SafeLink[]
  freshness: Freshness
}

export type VaultDocument = {
  path: string
  title: string
  markdown: string
  updated_at: string | null
  breadcrumbs: SafeLink[]
}

export type HealthcheckSummary = {
  check_id: string
  label: string
  severity: Severity
  status: string
  freshness: Freshness
  warning_text: string | null
  source_label: string
}

export type SystemSignal = {
  signal_id: string
  label: string
  status: Severity
  summary: string
  freshness: Freshness
}

export type DashboardSummaryResponse = ResourceEnvelope<DashboardSummary, { links_count: number }>
export type MugiwarasCatalogResponse = ResourceEnvelope<{ items: MugiwaraCard[]; crew_rules_document: CrewRulesDocument }, { count: number; crew_rules_document: string; read_only: true }>
export type MugiwaraProfileResponse = ResourceEnvelope<MugiwaraProfile, { slug: string; read_only: true }>
export type MemorySummaryResponse = ResourceEnvelope<{ items: MemoryAgentSummary[] }, { count: number; sources: string[] }>
export type MemoryDetailResponse = ResourceEnvelope<MemoryAgentDetail, { mugiwara_slug: string; read_only: true }>
export type VaultIndexResponse = ResourceEnvelope<VaultIndex, { safe_root: string }>
export type VaultDocumentResponse = ResourceEnvelope<VaultDocument, { path: string; markdown_only: true }>
export type HealthcheckSummaryResponse = ResourceEnvelope<{ items: HealthcheckSummary[] }, { count: number }>
export type SystemSignalsResponse = ResourceEnvelope<{ items: SystemSignal[] }, { count: number }>

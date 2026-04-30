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
export type OperationalSeverity = 'low' | 'medium' | 'high' | 'critical'
export type HealthcheckStatus = 'pass' | 'warn' | 'fail' | 'stale' | 'not_configured' | 'unknown'

export type DashboardSection = {
  id: 'dashboard' | 'healthcheck' | 'mugiwaras' | 'memory' | 'vault' | 'skills'
  label: string
  status: 'healthy' | 'warning' | 'degraded'
}

export type DashboardFreshness = {
  updated_at: string | null
  label: string
  state: 'fresh' | 'stale' | 'unknown'
}

export type DashboardCount = {
  label: string
  value: number
  note: string
}

export type DashboardSummary = {
  sections: DashboardSection[]
  highest_severity: OperationalSeverity
  freshness: DashboardFreshness
  counts: DashboardCount[]
  links: SafeLink[]
}

export type SoulDocument = {
  document_id: string
  title: string
  display_path: string
  source_label: string
  read_only: true
  canonical: false
  markdown: string
}

export type MugiwaraCard = {
  slug: string
  name: string
  status: Severity
  description: string
  skills: string[]
  memory_badge: string
  links: SafeLink[]
  soul_document?: SoulDocument
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

export type HealthcheckFreshness = {
  updated_at: string | null
  label: string
  state: 'fresh' | 'stale' | 'unknown'
}

export type HealthcheckCurrentCause = {
  source_id: string
  label: string
  status: HealthcheckStatus
  severity: OperationalSeverity | 'unknown'
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
  severity: OperationalSeverity
  updated_at: string
  summary: string
}

export type HealthcheckEvent = {
  event_id: string
  source: string
  status: HealthcheckStatus
  timestamp: string
  detail: string
  kind: 'historical'
}

export type HealthcheckSummary = {
  check_id: string
  label: string
  severity: OperationalSeverity
  status: HealthcheckStatus
  freshness: HealthcheckFreshness
  warning_text: string | null
  source_label: string
}

export type HealthcheckWorkspace = {
  summary_bar: HealthcheckSummaryBar
  modules: HealthcheckModuleCard[]
  events: HealthcheckEvent[]
  principles: string[]
  signals: HealthcheckSummary[]
}

export type SystemSignal = {
  signal_id: string
  label: string
  status: Severity
  summary: string
  freshness: Freshness
}

export type SystemMetricSourceState = 'live' | 'unknown'
export type SystemMetricsState = 'live' | 'degraded'

export type SystemCapacityMetric = {
  used_bytes: number | null
  total_bytes: number | null
  used_percent: number | null
  source_state: SystemMetricSourceState
}

export type SystemUptimeMetric = {
  days: number | null
  hours: number | null
  minutes: number | null
  source_state: SystemMetricSourceState
}

export type SystemMetrics = {
  ram: SystemCapacityMetric
  disk: SystemCapacityMetric
  uptime: SystemUptimeMetric
  updated_at: string
  source_state: SystemMetricsState
}

export type UsageFreshness = {
  state: 'fresh' | 'stale' | 'unknown'
  age_minutes: number | null
  label: string
}

export type UsageWindowStatus = 'normal' | 'high' | 'critical' | 'limit_reached' | 'unknown'

export type UsageCurrent = {
  current_snapshot: {
    captured_at: string | null
    source_label: string
    freshness: UsageFreshness
  }
  plan: {
    type: string
    allowed: boolean | null
    limit_reached: boolean | null
    additional_limits_count: number
  }
  primary_window: {
    label: 'Ventana 5h'
    used_percent: number | null
    window_seconds: number | null
    started_at: string | null
    reset_at: string | null
    reset_after_seconds: number | null
    status: UsageWindowStatus
  }
  secondary_cycle: {
    label: 'Ciclo semanal Codex'
    used_percent: number | null
    window_seconds: number | null
    started_at: string | null
    reset_at: string | null
    reset_after_seconds: number | null
    status: UsageWindowStatus
  }
  recommendation: {
    state: 'normal' | 'alto' | 'critico' | 'limite_alcanzado' | 'datos_antiguos' | 'sin_datos'
    label: string
    message: string
  }
  methodology: {
    cycle_copy: string
    primary_window_formula: string
    secondary_cycle_formula: string
    privacy: string
  }
}

export type UsageCalendarRange = 'current_cycle' | 'previous_cycle' | '7d' | '30d'
export type UsageCalendarDayStatus = 'normal' | 'high' | 'critical' | 'unknown'

export type UsageCalendar = {
  range: UsageCalendarRange
  timezone: 'Europe/Madrid'
  current_cycle: {
    started_at: string | null
    reset_at: string | null
    label: 'Ciclo semanal Codex'
  } | null
  days: Array<{
    date: string
    codex_segment: {
      started_at: string
      ended_at: string
      partial: boolean
      reason: 'cycle_started_today' | 'cycle_resets_today' | null
    }
    secondary_delta_percent: number | null
    primary_windows_count: number
    peak_primary_used_percent: number | null
    status: UsageCalendarDayStatus
  }>
  empty_reason?: 'not_configured' | 'unknown'
}

export type UsageFiveHourWindow = {
  started_at: string
  ended_at: string
  assigned_date?: string | null
  peak_used_percent: number | null
  delta_percent: number | null
  samples_count: number
  status: UsageWindowStatus
}

export type UsageFiveHourWindows = {
  windows: UsageFiveHourWindow[]
  empty_reason: 'not_configured' | null
}

export type UsageFiveHourWindowDays = {
  timezone: 'Europe/Madrid'
  days: Array<{
    date: string
    started_at: string
    ended_at: string
    relative_label: 'hoy' | 'ayer' | null
    windows: UsageFiveHourWindow[]
  }>
  empty_reason: 'not_configured' | null
}

export type UsageActivityRange = UsageCalendarRange
export type UsageActivityLevel = 'low' | 'medium' | 'high'

export type UsageHermesActivity = {
  range: {
    name: UsageActivityRange
    started_at: string
    ended_at: string
  }
  totals: {
    profiles_count: number
    sessions_count: number
    messages_count: number
    tool_calls_count: number
    weekly_tokens_count: number
    total_tokens_count: number
    dominant_profile: string | null
  }
  profiles: Array<{
    profile: string
    sessions_count: number
    messages_count: number
    tool_calls_count: number
    tokens_count: number
    total_tokens_count: number
    first_activity_at: string | null
    last_activity_at: string | null
    activity_level: UsageActivityLevel
  }>
  privacy: {
    mode: 'read_only_aggregated'
    correlation: 'orientativa'
    exclusions: string[]
  }
  empty_reason: 'not_configured' | 'unknown' | 'no_activity' | null
}


export type GitSourceState = 'ready' | 'unknown'
export type GitWorkingTreeState = 'clean' | 'dirty' | 'unknown'

export type GitRepoStatus = {
  source_state: GitSourceState
  working_tree: GitWorkingTreeState
  changed_files_count: number | null
  untracked_files_count: number | null
  current_branch: string | null
}

export type GitRepoSummary = {
  repo_id: string
  label: string
  scope: string
  status: GitRepoStatus
}

export type GitRepoIndex = {
  repos: GitRepoSummary[]
}

export type GitCommitTrailers = {
  mugiwara_agent: string | null
  signed_off_by: string | null
}

export type GitCommitSummary = {
  sha: string
  short_sha: string
  author_name: string
  author_email: string
  authored_at: string
  committed_at: string
  subject: string
  trailers: GitCommitTrailers
}

export type GitCommitList = {
  repo_id: string
  commits: GitCommitSummary[]
  limit: number
  next_cursor: string | null
  source_state: GitSourceState
}

export type GitBranchSummary = {
  name: string
  current: boolean
  sha: string
  short_sha: string
}

export type GitBranchList = {
  repo_id: string
  current_branch: string | null
  branches: GitBranchSummary[]
  source_state: GitSourceState
}

export type GitCommitFileSummary = {
  path: string | null
  change_type: string
  additions: number | null
  deletions: number | null
  binary: boolean
  omitted: boolean
  omitted_reason: string | null
}

export type GitCommitDetail = {
  repo_id: string
  commit: GitCommitSummary | null
  files: GitCommitFileSummary[]
  source_state: GitSourceState
}

export type GitDiffLine = {
  kind: 'hunk' | 'addition' | 'deletion' | 'context'
  content: string
}

export type GitCommitDiffFile = GitCommitFileSummary & {
  truncated: boolean
  redacted: boolean
  lines: GitDiffLine[]
}

export type GitCommitDiff = {
  repo_id: string
  sha: string
  files: GitCommitDiffFile[]
  truncated: boolean
  redacted: boolean
  omitted_files_count: number
  source_state: GitSourceState
}

export type DashboardSummaryResponse = ResourceEnvelope<DashboardSummary, { links_count: number }>
export type MugiwarasCatalogResponse = ResourceEnvelope<{ items: MugiwaraCard[]; crew_rules_document: CrewRulesDocument }, { count: number; crew_rules_document: string; read_only: true }>
export type MugiwaraProfileResponse = ResourceEnvelope<MugiwaraProfile, { slug: string; read_only: true }>
export type MemorySummaryResponse = ResourceEnvelope<{ items: MemoryAgentSummary[] }, { count: number; sources: string[] }>
export type MemoryDetailResponse = ResourceEnvelope<MemoryAgentDetail, { mugiwara_slug: string; read_only: true }>
export type VaultIndexResponse = ResourceEnvelope<VaultIndex, { safe_root: string }>
export type VaultDocumentResponse = ResourceEnvelope<VaultDocument, { path: string; markdown_only: true }>
export type HealthcheckWorkspaceResponse = ResourceEnvelope<HealthcheckWorkspace, { count: number; read_only: true; sanitized: true; source: string }>
export type HealthcheckSummaryResponse = ResourceEnvelope<{ items: HealthcheckSummary[] }, { count: number }>
export type UsageCurrentResponse = ResourceEnvelope<UsageCurrent, { read_only: true; sanitized: true; source: string; refresh_interval_minutes: number }>
export type UsageCalendarResponse = ResourceEnvelope<UsageCalendar, { read_only: true; sanitized: true; source: string; range: UsageCalendarRange; timezone: 'Europe/Madrid' }>
export type UsageFiveHourWindowsResponse = ResourceEnvelope<UsageFiveHourWindows, { read_only: true; sanitized: true; source: string; limit: number }>
export type UsageFiveHourWindowDaysResponse = ResourceEnvelope<UsageFiveHourWindowDays, { read_only: true; sanitized: true; source: string; range: '7d'; timezone: 'Europe/Madrid' }>
export type UsageHermesActivityResponse = ResourceEnvelope<UsageHermesActivity, { read_only: true; sanitized: true; source: string; range: UsageActivityRange }>
export type GitMeta = { read_only: true; sanitized: true; source: string }
export type GitRepoIndexResponse = ResourceEnvelope<GitRepoIndex, GitMeta>
export type GitCommitListResponse = ResourceEnvelope<GitCommitList, GitMeta>
export type GitBranchListResponse = ResourceEnvelope<GitBranchList, GitMeta>
export type GitCommitDetailResponse = ResourceEnvelope<GitCommitDetail, GitMeta>
export type GitCommitDiffResponse = ResourceEnvelope<GitCommitDiff, GitMeta>
export type SystemMetricsResponse = ResourceEnvelope<SystemMetrics, { read_only: true; sanitized: true; source: string; disk_target: 'fastapi-visible-root-filesystem' }>
export type SystemSignalsResponse = ResourceEnvelope<{ items: SystemSignal[] }, { count: number }>

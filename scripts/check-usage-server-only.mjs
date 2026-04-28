#!/usr/bin/env node
/** Static safety check for Phase 17.2 Usage server-only integration. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const httpPath = join(repoRoot, 'apps/web/src/modules/usage/api/usage-http.ts')
const pagePath = join(repoRoot, 'apps/web/src/app/usage/page.tsx')
const usageWindowDaysSelectorPath = join(repoRoot, 'apps/web/src/modules/usage/UsageWindowDaysSelector.tsx')
const navPath = join(repoRoot, 'apps/web/src/shared/ui/navigation/SidebarNav.tsx')
const usageServicePath = join(repoRoot, 'apps/api/src/modules/usage/service.py')
const usageRouterPath = join(repoRoot, 'apps/api/src/modules/usage/router.py')
const failures = []

const http = readFileSync(httpPath, 'utf8')
const page = readFileSync(pagePath, 'utf8')
const usageWindowDaysSelector = readFileSync(usageWindowDaysSelectorPath, 'utf8')
const nav = readFileSync(navPath, 'utf8')
const usageService = readFileSync(usageServicePath, 'utf8')
const usageRouter = readFileSync(usageRouterPath, 'utf8')
const globalsPath = join(repoRoot, 'apps/web/src/app/globals.css')
const globals = readFileSync(globalsPath, 'utf8')
const activityLoader = usageService.slice(
  usageService.indexOf('def _load_hermes_profile_activity'),
  usageService.indexOf('def _load_latest_snapshot'),
)

if (!http.includes("import 'server-only'")) {
  failures.push('usage http adapter must be server-only guarded')
}
if (!http.includes("USAGE_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'")) {
  failures.push('usage http adapter must use MUGIWARA_CONTROL_PANEL_API_URL')
}
if (http.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL') || page.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('usage must not use public backend env')
}
if (!http.includes('/api/v1/usage/current')) {
  failures.push('usage adapter must call the fixed current endpoint')
}
if (!http.includes('/api/v1/usage/calendar?range=')) {
  failures.push('usage adapter must call the fixed calendar endpoint with allowlisted range')
}
if (!http.includes('/api/v1/usage/five-hour-windows?limit=')) {
  failures.push('usage adapter must preserve the fixed five-hour windows endpoint with allowlisted limit')
}
if (!http.includes('/api/v1/usage/five-hour-window-days')) {
  failures.push('usage adapter must call the fixed five-hour window days endpoint')
}
if (!http.includes('/api/v1/usage/hermes-activity?range=')) {
  failures.push('usage adapter must call the fixed hermes activity endpoint with allowlisted range')
}
if (!http.includes('UsageCalendarRange') || !http.includes('UsageCalendarResponse') || !http.includes('UsageFiveHourWindowDaysResponse') || !http.includes('UsageFiveHourWindowsResponse') || !http.includes('UsageHermesActivityResponse')) {
  failures.push('usage adapter must type calendar, five-hour windows, five-hour window days and Hermes activity responses via shared contracts')
}
if (!page.includes('Calendario por fecha natural') || !page.includes('Europe/Madrid')) {
  failures.push('usage page must render the natural-date calendar with timezone context')
}
if (!page.includes('usage-calendar-grid') || !page.includes('primary_windows_count')) {
  failures.push('usage page must render a responsive calendar grid without generic table overflow')
}
for (const removedCopy of ['Primera lectura histórica saneada', 'Elige un día natural en Europe/Madrid', 'Lectura read-only de actividad local Hermes']) {
  if (page.includes(removedCopy) || usageWindowDaysSelector.includes(removedCopy)) {
    failures.push(`usage page must not render removed explanatory copy: ${removedCopy}`)
  }
}
if (!page.includes('Ventanas 5h por día') || !usageWindowDaysSelector.includes('usage-window-day-selector') || !usageWindowDaysSelector.includes('role="tablist"') || !usageWindowDaysSelector.includes('delta_percent')) {
  failures.push('usage page must render selectable five-hour window days without generic table overflow')
}
if (!page.includes('Actividad Hermes agregada') || !page.includes('usage-hermes-activity-list') || !page.includes('correlación orientativa')) {
  failures.push('usage page must render Hermes aggregated activity as orientative correlation without generic table overflow')
}
if (!page.includes('Tokens Hermes') || !page.includes('weekly_tokens_count') || !page.includes('total_tokens_count')) {
  failures.push('usage page must render aggregate Hermes token counters without raw sessions')
}
if (!page.includes('CompactActivityCount') || !page.includes('formatCompactActivityCount') || !page.includes('usage-compact-number') || !page.includes('aria-label={`${ariaLabel}: ${fullValue}`')) {
  failures.push('usage token counters must use compact visual numbers while preserving full values accessibly')
}
if (!usageWindowDaysSelector.includes('usage-window-day-tab-') || !usageWindowDaysSelector.includes('usage-window-day-panel-') || !usageWindowDaysSelector.includes('aria-labelledby={selectedTabId}') || !usageWindowDaysSelector.includes('tabIndex={selected ? 0 : -1}') || !usageWindowDaysSelector.includes('handleTabListKeyDown') || !usageWindowDaysSelector.includes("event.key === 'ArrowRight'") || !usageWindowDaysSelector.includes("event.key === 'Home'") || !usageWindowDaysSelector.includes("event.key === 'End'")) {
  failures.push('usage daily selector must expose stable tab ids, aria-labelledby tabpanel wiring and full keyboard navigation baseline')
}
if (!usageWindowDaysSelector.includes('compareWindowByMostRecentStartedAt') || !usageWindowDaysSelector.includes('selectedWindows.map')) {
  failures.push('usage five-hour day windows must render most recent windows first')
}
if (!usageWindowDaysSelector.includes('usage-scroll-hint') || !usageWindowDaysSelector.includes('usage-scroll-affordance') || !page.includes('usage-scroll-affordance')) {
  failures.push('usage internal scroll areas must expose a visible scroll affordance and hint')
}
if (!globals.includes('.usage-window-day-selector__button:focus-visible') || !globals.includes('.usage-scroll-affordance') || !globals.includes('scrollbar-color') || !globals.includes('.usage-compact-number__full') || !globals.includes('.usage-top-cards')) {
  failures.push('usage CSS must preserve equal-height top cards, focus-visible, scroll affordance and compact-number styling')
}
const topCardsStart = page.indexOf('aria-label="Estado actual de Usage"')
const topCardsEnd = page.indexOf('aria-label="Calendario Usage"')
const topCards = topCardsStart >= 0 && topCardsEnd > topCardsStart ? page.slice(topCardsStart, topCardsEnd) : ''
const expectedTopCards = ['Tokens Hermes', 'Ventana semanal', 'Ventana 5h', 'Cuenta Codex']
const topCardPositions = expectedTopCards.map((label) => topCards.indexOf(label))
if (topCardPositions.some((position) => position < 0) || topCardPositions.some((position, index) => index > 0 && position <= topCardPositions[index - 1])) {
  failures.push('usage top cards must be ordered as Tokens Hermes, Ventana semanal, Ventana 5h and Cuenta Codex')
}
if (topCards.includes('Recomendación actual')) {
  failures.push('usage top cards must not render the Recomendación actual card')
}
if (page.includes('eyebrow="Metodología"') || page.includes('Alcance Phase 17.4d') || page.includes('Deny by default')) {
  failures.push('usage page must remove heavy methodology/scope/security explainer containers')
}
if (!page.includes('const usageCoreStatus = currentResponse.status') || page.includes(': hermesActivityResponse.status')) {
  failures.push('usage page must not promote Hermes activity status to global Usage core status')
}
if (!page.includes('noticeFromHermesActivityStatus(hermesActivityResponse.status)') || !page.includes('Actividad Hermes no configurada')) {
  failures.push('usage page must localize Hermes activity not_configured in its own section')
}
if (!page.includes('Actividad Hermes sin sesiones en el rango') || !page.includes('hermes-activity: empty')) {
  failures.push('usage page must distinguish configured Hermes activity with no sessions from not_configured')
}
for (const forbidden of ['state.db', 'MUGIWARA_HERMES_PROFILES_ROOT', 'conversaciones', 'prompts crudos', 'tokens por sesión', 'tokens por conversación']) {
  if (page.includes(forbidden)) {
    failures.push(`usage page must not render Hermes sensitive internals: ${forbidden}`)
  }
}
if (http.includes('path=') || http.includes('target=') || http.includes('method=')) {
  failures.push('usage adapter must not grow generic proxy parameters')
}
if (!http.includes("parsed.protocol !== 'http:'") || !http.includes("parsed.protocol !== 'https:'")) {
  failures.push('usage http adapter must reject non-http(s) API base URLs')
}
if (http.includes('fetch(')) {
  failures.push('usage http adapter must avoid Next.js instrumented fetch metadata for backend URL secrecy')
}
if (!page.includes("export const dynamic = 'force-dynamic'")) {
  failures.push('usage page must force dynamic rendering')
}
if (page.includes("'use client'")) {
  failures.push('usage page must remain a server page')
}
if (page.includes('process.env')) {
  failures.push('usage page must not read backend env directly')
}
if (!page.includes('Ciclo semanal Codex') || !page.includes('ciclo semanal Codex')) {
  failures.push('usage page must render ciclo semanal Codex wording')
}
if (!nav.includes("href: '/usage'") || !nav.includes("label: 'Uso'")) {
  failures.push('sidebar navigation must expose Uso /usage')
}
if (!usageRouter.includes("@router.get('/five-hour-window-days')") || !usageRouter.includes("resource='usage.five_hour_window_days'")) {
  failures.push('usage backend must expose the fixed five-hour window days endpoint')
}
if (!usageRouter.includes("@router.get('/hermes-activity')") || !usageRouter.includes("resource='usage.hermes_activity'")) {
  failures.push('usage backend must expose the fixed hermes activity endpoint')
}
if (!usageRouter.includes("range: UsageActivityRange = '7d'")) {
  failures.push('usage hermes activity endpoint must use an allowlisted range type')
}
if (!usageService.includes("HERMES_PROFILES_ROOT_ENV = 'MUGIWARA_HERMES_PROFILES_ROOT'")) {
  failures.push('usage hermes activity must use a private server-side profiles root env')
}
if (!usageService.includes('HERMES_ACTIVITY_PROFILES =') || !usageService.includes("'luffy'") || !usageService.includes("'jinbe'")) {
  failures.push('usage hermes activity must use an explicit Mugiwara profile allowlist')
}
if (!usageService.includes("file:{state_db}?mode=ro")) {
  failures.push('usage hermes activity must open Hermes profile state read-only')
}
if (!usageService.includes("'no_activity'") || !usageService.includes("return 'empty'")) {
  failures.push('usage hermes activity must distinguish configured empty activity from missing configuration')
}
if (!usageService.includes('weekly_tokens_count') || !usageService.includes('total_tokens_count')) {
  failures.push('usage hermes activity must expose only aggregate token counters')
}
if (!usageService.includes('def _assign_relative_activity_levels') || !usageService.includes('percentile <= 1 / 3') || !usageService.includes("profile['activity_level'] = 'medium'")) {
  failures.push('usage hermes activity must distribute activity levels relatively across Mugiwara profiles')
}
if (!usageService.includes('def _assign_usage_window_date') || !usageService.includes('USAGE_CALENDAR_TIMEZONE')) {
  failures.push('usage backend must assign five-hour windows to Europe/Madrid natural days')
}
for (const forbidden of ['SELECT *', 'system_prompt', 'model_config', 'user_id', 'token_count', 'estimated_cost_usd', 'actual_cost_usd', 'billing_base_url', 'title']) {
  if (activityLoader.includes(forbidden)) {
    failures.push(`usage hermes activity must not select or serialize sensitive session field: ${forbidden}`)
  }
}

if (failures.length > 0) {
  console.error('Usage server-only integration check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Usage server-only integration check passed')

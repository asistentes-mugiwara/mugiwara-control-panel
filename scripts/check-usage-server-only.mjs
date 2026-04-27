#!/usr/bin/env node
/** Static safety check for Phase 17.2 Usage server-only integration. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const httpPath = join(repoRoot, 'apps/web/src/modules/usage/api/usage-http.ts')
const pagePath = join(repoRoot, 'apps/web/src/app/usage/page.tsx')
const navPath = join(repoRoot, 'apps/web/src/shared/ui/navigation/SidebarNav.tsx')
const failures = []

const http = readFileSync(httpPath, 'utf8')
const page = readFileSync(pagePath, 'utf8')
const nav = readFileSync(navPath, 'utf8')

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
  failures.push('usage adapter must call the fixed five-hour windows endpoint with allowlisted limit')
}
if (!http.includes('UsageCalendarRange') || !http.includes('UsageCalendarResponse') || !http.includes('UsageFiveHourWindowsResponse')) {
  failures.push('usage adapter must type calendar and five-hour windows responses via shared contracts')
}
if (!page.includes('Calendario por fecha natural') || !page.includes('Europe/Madrid')) {
  failures.push('usage page must render the natural-date calendar with timezone context')
}
if (!page.includes('usage-calendar-grid') || !page.includes('primary_windows_count')) {
  failures.push('usage page must render a responsive calendar grid without generic table overflow')
}
if (!page.includes('Ventanas 5h históricas') || !page.includes('usage-windows-list') || !page.includes('delta_percent')) {
  failures.push('usage page must render dedicated five-hour windows without generic table overflow')
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

if (failures.length > 0) {
  console.error('Usage server-only integration check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Usage server-only integration check passed')

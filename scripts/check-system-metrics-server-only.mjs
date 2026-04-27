#!/usr/bin/env node
/**
 * Static guardrail for Issue #36.3 system metrics server-only header integration.
 *
 * Keeps RAM/disk/uptime consumption in the Next.js server boundary and prevents
 * regressions to browser-side backend fetches, public backend env vars or raw errors.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  systemHttp: join(repoRoot, 'apps/web/src/modules/system/api/system-metrics-http.ts'),
  systemViewModel: join(repoRoot, 'apps/web/src/modules/system/view-models/system-metrics-summary.ts'),
  layout: join(repoRoot, 'apps/web/src/app/layout.tsx'),
  appShell: join(repoRoot, 'apps/web/src/shared/ui/app-shell/AppShell.tsx'),
  topbar: join(repoRoot, 'apps/web/src/shared/ui/app-shell/Topbar.tsx'),
  shellMetricTypes: join(repoRoot, 'apps/web/src/shared/ui/app-shell/system-metrics.ts'),
  runtimeConfig: join(repoRoot, 'docs/runtime-config.md'),
  readModels: join(repoRoot, 'docs/read-models.md'),
  openspec: join(repoRoot, 'openspec/issue-36-3-system-metrics-closeout.md'),
}

const failures = []

function read(pathName, label) {
  if (!existsSync(pathName)) {
    failures.push(`missing ${label}: ${pathName}`)
    return ''
  }
  return readFileSync(pathName, 'utf8')
}

function mustInclude(text, snippet, label) {
  if (!text.includes(snippet)) failures.push(`${label} must include: ${snippet}`)
}

function mustNotInclude(text, snippet, label) {
  if (text.includes(snippet)) failures.push(`${label} must not include: ${snippet}`)
}

function mustMatch(text, pattern, label, message) {
  if (!pattern.test(text)) failures.push(`${label} must ${message}`)
}

const packageJsonText = read(paths.packageJson, 'package.json')
const systemHttp = read(paths.systemHttp, 'system metrics server-only adapter')
const systemViewModel = read(paths.systemViewModel, 'system metrics header view-model')
const layout = read(paths.layout, 'root layout')
const appShell = read(paths.appShell, 'AppShell')
const topbar = read(paths.topbar, 'Topbar')
const shellMetricTypes = read(paths.shellMetricTypes, 'header metrics prop types')
const runtimeConfig = read(paths.runtimeConfig, 'runtime config docs')
const readModels = read(paths.readModels, 'read models docs')
const openspec = read(paths.openspec, 'Issue 36.3 OpenSpec')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson?.scripts?.['verify:system-metrics-server-only'] !== 'node scripts/check-system-metrics-server-only.mjs') {
  failures.push('package.json must expose verify:system-metrics-server-only')
}

mustInclude(systemHttp, "import 'server-only'", 'system metrics adapter')
mustInclude(systemHttp, "SYSTEM_METRICS_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'", 'system metrics adapter')
mustInclude(systemHttp, '/api/v1/system/metrics', 'system metrics adapter')
mustInclude(systemHttp, "cache: 'no-store'", 'system metrics adapter')
mustInclude(systemHttp, "parsed.protocol !== 'http:'", 'system metrics adapter')
mustInclude(systemHttp, "parsed.protocol !== 'https:'", 'system metrics adapter')
mustInclude(systemHttp, 'SystemMetricsResponse', 'system metrics adapter')
mustInclude(systemHttp, 'throw new SystemMetricsApiError', 'system metrics adapter')

for (const forbidden of [
  'NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL',
  'process.env.NEXT_PUBLIC',
  'path=',
  'target=',
  'mount=',
  'device=',
  'command=',
  'method=',
]) {
  mustNotInclude(systemHttp, forbidden, 'system metrics adapter')
}

mustInclude(layout, "export const dynamic = 'force-dynamic'", 'root layout')
mustInclude(layout, 'fetchSystemMetrics()', 'root layout')
mustInclude(layout, 'createHeaderSystemMetricsSnapshot(response.data)', 'root layout')
mustInclude(layout, "createUnavailableHeaderSystemMetrics('not_configured')", 'root layout')
mustInclude(layout, "createUnavailableHeaderSystemMetrics('unavailable')", 'root layout')
mustInclude(layout, '<AppShell systemMetrics={headerSystemMetrics}>', 'root layout')
mustNotInclude(layout, 'NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL', 'root layout')

mustInclude(systemViewModel, 'createUnavailableHeaderSystemMetrics', 'system metrics view-model')
mustInclude(systemViewModel, "source_state: 'unknown'", 'system metrics view-model')
mustInclude(systemViewModel, "sourceState: metrics.source_state === 'live' ? 'live' : 'degraded'", 'system metrics view-model')
mustInclude(shellMetricTypes, 'HeaderSystemMetrics', 'header metrics prop types')
mustInclude(appShell, 'systemMetrics: HeaderSystemMetrics', 'AppShell')
mustInclude(appShell, 'systemMetrics={systemMetrics}', 'AppShell')

for (const [label, text] of [['AppShell', appShell], ['Topbar', topbar]]) {
  mustNotInclude(text, 'fetch(', label)
  mustNotInclude(text, 'process.env', label)
  mustNotInclude(text, 'MUGIWARA_CONTROL_PANEL_API_URL', label)
  mustNotInclude(text, 'NEXT_PUBLIC', label)
  mustNotInclude(text, '/api/v1/system/metrics', label)
  mustNotInclude(text, 'SystemMetricsApiError', label)
  mustNotInclude(text, 'Traceback', label)
  mustNotInclude(text, 'Stack trace', label)
  mustNotInclude(text, '/proc/meminfo', label)
  mustNotInclude(text, '/proc/uptime', label)
}

for (const snippet of [
  'RAM',
  'Disco',
  'Uptime',
  'topbar__metrics-strip',
  'topbar__metric-chip',
  'formatCapacityValue',
  'formatUptimeValue',
]) {
  mustInclude(topbar, snippet, 'Topbar')
}

mustMatch(topbar, /function\s+metricLabel\([^)]*\)\s*{\s*return label\s*}/s, 'Topbar', 'keep stable short metric labels')

for (const snippet of [
  'System metrics header',
  'verify:system-metrics-server-only',
  'sin `NEXT_PUBLIC_*`',
  'no hacen fetch',
  'no leen `process.env`',
]) {
  mustInclude(runtimeConfig, snippet, 'runtime config docs')
}

for (const snippet of [
  'header global siempre visible',
  'server-only',
  'sin `NEXT_PUBLIC_*`',
  'sin fetch browser directo',
]) {
  mustInclude(readModels, snippet, 'read models docs')
}

for (const snippet of [
  'Issue #36.3',
  'verify:system-metrics-server-only',
  '36.1',
  '36.2',
  'closeout',
]) {
  mustInclude(openspec, snippet, 'Issue 36.3 OpenSpec')
}

if (failures.length > 0) {
  console.error('System metrics server-only check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('System metrics server-only check passed.')

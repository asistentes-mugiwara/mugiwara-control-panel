#!/usr/bin/env node
/** Static safety check for Phase 12.5 Healthcheck/Dashboard server-only integration. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const targets = [
  {
    name: 'healthcheck',
    httpPath: join(repoRoot, 'apps/web/src/modules/healthcheck/api/healthcheck-http.ts'),
    pagePath: join(repoRoot, 'apps/web/src/app/healthcheck/page.tsx'),
    envSnippet: "HEALTHCHECK_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'",
  },
  {
    name: 'dashboard',
    httpPath: join(repoRoot, 'apps/web/src/modules/dashboard/api/dashboard-http.ts'),
    pagePath: join(repoRoot, 'apps/web/src/app/dashboard/page.tsx'),
    envSnippet: "DASHBOARD_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'",
  },
]
const failures = []

for (const target of targets) {
  const http = readFileSync(target.httpPath, 'utf8')
  const page = readFileSync(target.pagePath, 'utf8')

  if (!http.includes("import 'server-only'")) {
    failures.push(`${target.name} http adapter must be server-only guarded`)
  }
  if (!http.includes(target.envSnippet)) {
    failures.push(`${target.name} http adapter must use MUGIWARA_CONTROL_PANEL_API_URL`)
  }
  if (http.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')) {
    failures.push(`${target.name} http adapter must not use public backend env`)
  }
  if (!http.includes("parsed.protocol !== 'http:'") || !http.includes("parsed.protocol !== 'https:'")) {
    failures.push(`${target.name} http adapter must reject non-http(s) API base URLs`)
  }
  if (!http.includes("cache: 'no-store'")) {
    failures.push(`${target.name} http adapter must fetch with cache: no-store`)
  }
  if (!page.includes("export const dynamic = 'force-dynamic'")) {
    failures.push(`${target.name} page must force dynamic rendering`)
  }
  if (page.includes("'use client'")) {
    failures.push(`${target.name} page must remain a server page`)
  }
  if (page.includes('process.env') || page.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')) {
    failures.push(`${target.name} page must not read backend env directly`)
  }
}

if (failures.length > 0) {
  console.error('Healthcheck/Dashboard server-only integration check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Healthcheck/Dashboard server-only integration check passed')

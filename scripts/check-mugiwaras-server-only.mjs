#!/usr/bin/env node
/**
 * Static safety check for Phase 12.3f.
 *
 * Inputs: source files for the Mugiwaras server loader/API adapter.
 * Output: exits non-zero when Mugiwaras falls back to a public API env var,
 * loses the server-only guard, or loses runtime dynamic rendering. Read-only.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const mugiwarasHttpPath = join(repoRoot, 'apps/web/src/modules/mugiwaras/api/mugiwaras-http.ts')
const mugiwarasPagePath = join(repoRoot, 'apps/web/src/app/mugiwaras/page.tsx')

const mugiwarasHttp = readFileSync(mugiwarasHttpPath, 'utf8')
const mugiwarasPage = readFileSync(mugiwarasPagePath, 'utf8')

const failures = []

if (!mugiwarasHttp.includes("import 'server-only'")) {
  failures.push('mugiwaras-http.ts must be server-only guarded')
}

if (!mugiwarasHttp.includes("MUGIWARAS_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'")) {
  failures.push('mugiwaras-http.ts must use the server-only MUGIWARA_CONTROL_PANEL_API_URL env name')
}

if (mugiwarasHttp.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('mugiwaras-http.ts must not read NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')
}

if (!mugiwarasHttp.includes("parsed.protocol !== 'http:'") || !mugiwarasHttp.includes("parsed.protocol !== 'https:'")) {
  failures.push('mugiwaras-http.ts must reject non-http(s) API base URLs')
}

if (!mugiwarasPage.includes("export const dynamic = 'force-dynamic'")) {
  failures.push('mugiwaras/page.tsx must force dynamic rendering so server env is read at runtime')
}

if (!mugiwarasPage.includes('MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('mugiwaras/page.tsx must tell operators to configure the server-only env var')
}

if (mugiwarasPage.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('mugiwaras/page.tsx must not instruct operators to use the public env var')
}

if (failures.length > 0) {
  console.error('Mugiwaras server-only config check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Mugiwaras server-only config check passed')

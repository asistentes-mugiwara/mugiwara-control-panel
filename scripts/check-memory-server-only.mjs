#!/usr/bin/env node
/**
 * Static safety check for Phase 12.3c.
 *
 * Inputs: source files for the Memory server loader/API adapter.
 * Output: exits non-zero when Memory falls back to a public API env var or loses
 * the server-only guard. This script is intentionally read-only.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const memoryHttpPath = join(repoRoot, 'apps/web/src/modules/memory/api/memory-http.ts')
const memoryPagePath = join(repoRoot, 'apps/web/src/app/memory/page.tsx')

const memoryHttp = readFileSync(memoryHttpPath, 'utf8')
const memoryPage = readFileSync(memoryPagePath, 'utf8')

const failures = []

if (!memoryHttp.includes("import 'server-only'")) {
  failures.push('memory-http.ts must be server-only guarded')
}

if (!memoryHttp.includes("MEMORY_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'")) {
  failures.push('memory-http.ts must use the server-only MUGIWARA_CONTROL_PANEL_API_URL env name')
}

if (memoryHttp.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('memory-http.ts must not read NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')
}

if (!memoryHttp.includes("parsed.protocol !== 'http:'") || !memoryHttp.includes("parsed.protocol !== 'https:'")) {
  failures.push('memory-http.ts must reject non-http(s) API base URLs')
}

if (!memoryPage.includes("export const dynamic = 'force-dynamic'")) {
  failures.push('memory/page.tsx must force dynamic rendering so server env is read at runtime')
}

if (!memoryPage.includes('MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('memory/page.tsx must tell operators to configure the server-only env var')
}

if (memoryPage.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('memory/page.tsx must not instruct operators to use the public env var')
}

if (failures.length > 0) {
  console.error('Memory server-only config check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Memory server-only config check passed')

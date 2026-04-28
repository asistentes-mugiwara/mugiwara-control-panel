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
const mugiwarasFixturePath = join(repoRoot, 'apps/web/src/modules/mugiwaras/view-models/mugiwara-card.fixture.ts')
const mugiwarasBackendServicePath = join(repoRoot, 'apps/api/src/modules/mugiwaras/service.py')
const mugiwaraCrestMapPath = join(repoRoot, 'apps/web/src/shared/mugiwara/crest-map.ts')

const mugiwarasHttp = readFileSync(mugiwarasHttpPath, 'utf8')
const mugiwarasPage = readFileSync(mugiwarasPagePath, 'utf8')
const mugiwarasFixture = readFileSync(mugiwarasFixturePath, 'utf8')
const mugiwarasBackendService = readFileSync(mugiwarasBackendServicePath, 'utf8')
const mugiwaraCrestMap = readFileSync(mugiwaraCrestMapPath, 'utf8')

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

const activeRoster = ['luffy', 'zoro', 'franky', 'nami', 'robin', 'usopp', 'jinbe', 'sanji', 'chopper', 'brook']

for (const slug of activeRoster) {
  const backendCardPattern = new RegExp(`MugiwaraCard\\(\\s*'${slug}'[\\s\\S]*?\\n\\s*'operativo'`, 'm')
  const fixtureCardPattern = new RegExp(`slug: '${slug}',[\\s\\S]*?status: 'operativo'`, 'm')
  if (!backendCardPattern.test(mugiwarasBackendService)) {
    failures.push(`backend CREW_CARDS must mark active Mugiwara ${slug} as operativo`)
  }
  if (!fixtureCardPattern.test(mugiwarasFixture)) {
    failures.push(`frontend fixture must mark active Mugiwara ${slug} as operativo`)
  }
  if (!mugiwarasBackendService.includes("SafeLink('Ver Skills', f'/skills?mugiwara={slug}')")) {
    failures.push('backend CREW_CARDS must generate slug-scoped skills links')
  }
  if (!mugiwarasFixture.includes(`href: '/skills?mugiwara=${slug}'`)) {
    failures.push(`frontend fixture must expose a slug-scoped skills link for ${slug}`)
  }
}

if (mugiwarasBackendService.includes("'Datos en standby'") || mugiwarasFixture.includes("'Datos en standby'")) {
  failures.push('Mugiwaras cards must not use data/skills standby as the primary operational status badge')
}

if (mugiwarasBackendService.includes("'Definido en canon'") || mugiwarasFixture.includes("'Definido en canon'")) {
  failures.push('Mugiwaras cards must not describe active canon members as only defined in canon')
}

if (mugiwaraCrestMap.includes('COO Físico y Concierge Personal') || mugiwaraCrestMap.includes('CLO y Asesor Legal\',')) {
  failures.push('frontend crest map roles for Jinbe/Sanji must stay aligned with current AGENTS.md roster canon')
}

if (failures.length > 0) {
  console.error('Mugiwaras server-only config check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Mugiwaras server-only config check passed')

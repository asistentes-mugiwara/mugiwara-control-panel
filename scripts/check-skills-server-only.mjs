#!/usr/bin/env node
/**
 * Static safety check for Phase 12.3h.
 *
 * Inputs: Skills browser adapter, server-only adapter, route handlers and page.
 * Output: exits non-zero when Skills regresses to public backend config, loses
 * the BFF route boundary, or shows obvious generic-proxy patterns. Read-only.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  browserAdapter: join(repoRoot, 'apps/web/src/modules/skills/api/skills-http.ts'),
  serverAdapter: join(repoRoot, 'apps/web/src/modules/skills/api/skills-server-http.ts'),
  validation: join(repoRoot, 'apps/web/src/modules/skills/api/skills-bff-validation.ts'),
  page: join(repoRoot, 'apps/web/src/app/skills/page.tsx'),
  catalogRoute: join(repoRoot, 'apps/web/src/app/api/control-panel/skills/route.ts'),
  auditRoute: join(repoRoot, 'apps/web/src/app/api/control-panel/skills/audit/route.ts'),
  detailRoute: join(repoRoot, 'apps/web/src/app/api/control-panel/skills/[skillId]/route.ts'),
  previewRoute: join(repoRoot, 'apps/web/src/app/api/control-panel/skills/[skillId]/preview/route.ts'),
}

const failures = []

for (const [name, path] of Object.entries(paths)) {
  if (!existsSync(path)) {
    failures.push(`missing ${name} at ${path}`)
  }
}

function read(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

const browserAdapter = read(paths.browserAdapter)
const serverAdapter = read(paths.serverAdapter)
const validation = read(paths.validation)
const page = read(paths.page)
const catalogRoute = read(paths.catalogRoute)
const auditRoute = read(paths.auditRoute)
const detailRoute = read(paths.detailRoute)
const previewRoute = read(paths.previewRoute)
const allRoutes = [catalogRoute, auditRoute, detailRoute, previewRoute].join('\n')

if (browserAdapter.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL') || browserAdapter.includes('process.env')) {
  failures.push('skills browser adapter must not read public env or process.env')
}

if (!browserAdapter.includes("const SKILLS_BFF_BASE_PATH = '/api/control-panel/skills'")) {
  failures.push('skills browser adapter must use same-origin /api/control-panel/skills base path')
}

if (browserAdapter.includes('http://') || browserAdapter.includes('https://')) {
  failures.push('skills browser adapter must not contain an absolute backend URL')
}

if (browserAdapter.includes('skills-server-http')) {
  failures.push('browser-side skills adapter must not import the server-only adapter')
}

if (!serverAdapter.includes("import 'server-only'")) {
  failures.push('skills server adapter must be guarded with server-only')
}

if (!serverAdapter.includes("SKILLS_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'")) {
  failures.push('skills server adapter must use MUGIWARA_CONTROL_PANEL_API_URL')
}

if (serverAdapter.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('skills server adapter must not read NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')
}

if (!serverAdapter.includes("parsed.protocol !== 'http:'") || !serverAdapter.includes("parsed.protocol !== 'https:'")) {
  failures.push('skills server adapter must reject non-http(s) API base URLs')
}

if (!serverAdapter.includes("cache: 'no-store'")) {
  failures.push('skills server adapter must fetch upstream with cache: no-store')
}

if (page.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL') || page.includes('API base URL')) {
  failures.push('/skills page must not show public env instructions or backend base URL copy')
}

if (!page.includes('BFF same-origin') || !page.includes('MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('/skills page must describe same-origin BFF and server-only configuration')
}

for (const [name, route] of Object.entries({ catalogRoute, auditRoute, detailRoute, previewRoute })) {
  if (!route.includes("export const dynamic = 'force-dynamic'")) {
    failures.push(`${name} must force dynamic execution`)
  }
  if (!route.includes("export const fetchCache = 'force-no-store'")) {
    failures.push(`${name} must force no-store fetch cache`)
  }
}

if (!catalogRoute.includes("fetchSkillsServerJson('/api/v1/skills')")) {
  failures.push('catalog route must call the allowlisted FastAPI catalog endpoint')
}

if (!auditRoute.includes("fetchSkillsServerJson('/api/v1/skills/audit')")) {
  failures.push('audit route must call the allowlisted FastAPI audit endpoint')
}

if (!detailRoute.includes('validateSkillId(skillId)') || !previewRoute.includes('validateSkillId(skillId)')) {
  failures.push('dynamic skills routes must validate skillId before upstream fetch')
}

if (!detailRoute.includes('parseSkillUpdatePayload(request)')) {
  failures.push('update route must validate update payload before upstream fetch')
}

if (!previewRoute.includes('parseSkillPreviewPayload(request)')) {
  failures.push('preview route must validate preview payload before upstream fetch')
}

if (!validation.includes('SKILLS_BFF_BODY_LIMIT_BYTES = 256 * 1024')) {
  failures.push('BFF validation must keep the 256 KiB request body cap')
}

if (!validation.includes('SKILLS_BFF_CONTENT_LIMIT_BYTES = 200_000')) {
  failures.push('BFF validation must keep the 200,000 byte skill content cap')
}

if (!validation.includes('assertJsonContentType')) {
  failures.push('BFF validation must enforce application/json for write routes')
}

if (!validation.includes("import 'server-only'")) {
  failures.push('BFF validation/perimeter module must be guarded with server-only')
}

if (!validation.includes('MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS')) {
  failures.push('BFF validation/perimeter module must use server-only trusted origins config')
}

for (const [name, route] of Object.entries({ detailRoute, previewRoute })) {
  if (!route.includes('assertTrustedOriginForSkillsWrite(request)')) {
    failures.push(`${name} must enforce trusted Origin before Skills writes`)
  }
}

if (browserAdapter.includes('MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS')) {
  failures.push('browser-side skills adapter must not read trusted origins config')
}

if (allRoutes.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS') || validation.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS')) {
  failures.push('trusted origins config must not use NEXT_PUBLIC_*')
}

const forbiddenGenericProxySnippets = [
  'searchParams.get(\'path\')',
  'searchParams.get("path")',
  'searchParams.get(\'url\')',
  'searchParams.get("url")',
  'searchParams.get(\'target\')',
  'searchParams.get("target")',
  'request.nextUrl.searchParams',
  'params.path',
  'params.url',
  'params.target',
]

for (const snippet of forbiddenGenericProxySnippets) {
  if (allRoutes.includes(snippet) || serverAdapter.includes(snippet)) {
    failures.push(`skills BFF must not contain generic-proxy snippet: ${snippet}`)
  }
}

if (failures.length > 0) {
  console.error('Skills server-only BFF check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Skills server-only BFF check passed')

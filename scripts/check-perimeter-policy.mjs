#!/usr/bin/env node
/**
 * Static guardrail for the Phase 13 perimeter contract.
 *
 * Inputs: docs/security-perimeter.md, docs/runtime-config.md, package.json and
 * Skills BFF boundary files.
 * Output: exits non-zero if the private-by-default contract or obvious BFF
 * exposure guardrails regress. Read-only.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  perimeterDoc: join(repoRoot, 'docs/security-perimeter.md'),
  runtimeConfig: join(repoRoot, 'docs/runtime-config.md'),
  packageJson: join(repoRoot, 'package.json'),
  skillsBrowserAdapter: join(repoRoot, 'apps/web/src/modules/skills/api/skills-http.ts'),
  skillsServerAdapter: join(repoRoot, 'apps/web/src/modules/skills/api/skills-server-http.ts'),
  skillsBffValidation: join(repoRoot, 'apps/web/src/modules/skills/api/skills-bff-validation.ts'),
  skillsDetailRoute: join(repoRoot, 'apps/web/src/app/api/control-panel/skills/[skillId]/route.ts'),
  skillsPreviewRoute: join(repoRoot, 'apps/web/src/app/api/control-panel/skills/[skillId]/preview/route.ts'),
  apiMain: join(repoRoot, 'apps/api/src/main.py'),
}

const failures = []

function read(pathName, label) {
  if (!existsSync(pathName)) {
    failures.push(`missing ${label} at ${pathName}`)
    return ''
  }

  return readFileSync(pathName, 'utf8')
}

const perimeterDoc = read(paths.perimeterDoc, 'security perimeter document')
const runtimeConfig = read(paths.runtimeConfig, 'runtime config document')
const packageJsonText = read(paths.packageJson, 'package.json')
const skillsBrowserAdapter = read(paths.skillsBrowserAdapter, 'skills browser adapter')
const skillsServerAdapter = read(paths.skillsServerAdapter, 'skills server adapter')
const skillsBffValidation = read(paths.skillsBffValidation, 'skills BFF validation/perimeter module')
const skillsDetailRoute = read(paths.skillsDetailRoute, 'skills detail/update route')
const skillsPreviewRoute = read(paths.skillsPreviewRoute, 'skills preview route')
const apiMain = read(paths.apiMain, 'FastAPI main perimeter module')
const writeRoutes = [skillsDetailRoute, skillsPreviewRoute].join('\n')

function mustInclude(text, snippet, label) {
  if (!text.includes(snippet)) {
    failures.push(`${label} must include: ${snippet}`)
  }
}

mustInclude(perimeterDoc, 'internet-public: unsupported', 'security perimeter document')
mustInclude(perimeterDoc, 'Tailscale private access', 'security perimeter document')
mustInclude(perimeterDoc, 'Browser cookies must not be forwarded upstream by default.', 'security perimeter document')
mustInclude(perimeterDoc, 'Browser `Authorization` headers must not be forwarded upstream by default.', 'security perimeter document')
mustInclude(perimeterDoc, 'MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS', 'security perimeter document')
mustInclude(perimeterDoc, '403 trusted_origins_not_configured', 'security perimeter document')
mustInclude(perimeterDoc, '403 origin_required', 'security perimeter document')
mustInclude(perimeterDoc, '403 origin_not_allowed', 'security perimeter document')
mustInclude(perimeterDoc, '403 cors_not_supported', 'security perimeter document')
mustInclude(perimeterDoc, 'Request validation errors return a sanitized `validation_error` envelope', 'security perimeter document')
mustInclude(perimeterDoc, 'Issue #16, Healthcheck/Dashboard real-source hardening, stays after perimeter hardening.', 'security perimeter document')
mustInclude(runtimeConfig, 'docs/security-perimeter.md', 'runtime config document')
mustInclude(runtimeConfig, 'internet-public: unsupported', 'runtime config document')
mustInclude(runtimeConfig, 'npm run verify:perimeter-policy', 'runtime config document')
mustInclude(runtimeConfig, 'MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS', 'runtime config document')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson && packageJson.scripts?.['verify:perimeter-policy'] !== 'node scripts/check-perimeter-policy.mjs') {
  failures.push('package.json must expose verify:perimeter-policy')
}

if (skillsBrowserAdapter.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL') || skillsBrowserAdapter.includes('process.env')) {
  failures.push('skills browser adapter must not read backend environment variables')
}

if (!skillsBrowserAdapter.includes("const SKILLS_BFF_BASE_PATH = '/api/control-panel/skills'")) {
  failures.push('skills browser adapter must use the same-origin Skills BFF base path')
}


mustInclude(skillsBffValidation, "import 'server-only'", 'skills BFF validation/perimeter module')
mustInclude(skillsBffValidation, 'MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS', 'skills BFF validation/perimeter module')
mustInclude(skillsBffValidation, 'assertTrustedOriginForSkillsWrite', 'skills BFF validation/perimeter module')
mustInclude(skillsBffValidation, 'trusted_origins_not_configured', 'skills BFF validation/perimeter module')
mustInclude(skillsBffValidation, 'origin_required', 'skills BFF validation/perimeter module')
mustInclude(skillsBffValidation, 'origin_not_allowed', 'skills BFF validation/perimeter module')
mustInclude(skillsDetailRoute, 'assertTrustedOriginForSkillsWrite(request)', 'skills update route')
mustInclude(skillsPreviewRoute, 'assertTrustedOriginForSkillsWrite(request)', 'skills preview route')

if (skillsBrowserAdapter.includes('MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS')) {
  failures.push('skills browser adapter must not read trusted origins configuration')
}

mustInclude(apiMain, 'SECURITY_HEADERS', 'FastAPI main perimeter module')
mustInclude(apiMain, "'X-Content-Type-Options': 'nosniff'", 'FastAPI main perimeter module')
mustInclude(apiMain, "'Referrer-Policy': 'no-referrer'", 'FastAPI main perimeter module')
mustInclude(apiMain, "'X-Frame-Options': 'DENY'", 'FastAPI main perimeter module')
mustInclude(apiMain, "'Cache-Control': 'no-store'", 'FastAPI main perimeter module')
mustInclude(apiMain, 'cors_not_supported', 'FastAPI main perimeter module')
mustInclude(apiMain, '@app.exception_handler(RequestValidationError)', 'FastAPI main perimeter module')
mustInclude(apiMain, "'message': 'Request validation failed.'", 'FastAPI main perimeter module')


const forbiddenTrustedOriginSnippets = [
  'NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS',
  'Access-Control-Allow-Origin: *',
  "'Access-Control-Allow-Origin': '*'",
  '"Access-Control-Allow-Origin": "*"',
]

for (const snippet of forbiddenTrustedOriginSnippets) {
  if (writeRoutes.includes(snippet) || skillsBrowserAdapter.includes(snippet) || skillsBffValidation.includes(snippet)) {
    failures.push(`trusted origins must stay server-only and exact, forbidden snippet: ${snippet}`)
  }
}

const forbiddenWriteRouteSnippets = [
  'request.headers',
  "headers.get('authorization')",
  'headers.get("authorization")',
  "headers.get('cookie')",
  'headers.get("cookie")',
  'Authorization',
  'Cookie',
  'credentials: \'include\'',
  'credentials: "include"',
]

for (const snippet of forbiddenWriteRouteSnippets) {
  if (writeRoutes.includes(snippet)) {
    failures.push(`skills write BFF routes must not forward browser credentials/header snippet: ${snippet}`)
  }
}

if (skillsServerAdapter.includes('...init?.headers') || skillsServerAdapter.includes('headers: init?.headers')) {
  failures.push('skills server adapter must not forward arbitrary caller headers upstream')
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
  if (writeRoutes.includes(snippet) || skillsServerAdapter.includes(snippet)) {
    failures.push(`skills BFF must not contain generic-proxy snippet: ${snippet}`)
  }
}

if (failures.length > 0) {
  console.error('Perimeter policy check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Perimeter policy check passed')

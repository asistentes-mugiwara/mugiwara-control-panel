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
  skillsDetailRoute: join(repoRoot, 'apps/web/src/app/api/control-panel/skills/[skillId]/route.ts'),
  skillsPreviewRoute: join(repoRoot, 'apps/web/src/app/api/control-panel/skills/[skillId]/preview/route.ts'),
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
const skillsDetailRoute = read(paths.skillsDetailRoute, 'skills detail/update route')
const skillsPreviewRoute = read(paths.skillsPreviewRoute, 'skills preview route')
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
mustInclude(perimeterDoc, 'Phase 13.3 may implement a concrete trusted-origin configuration.', 'security perimeter document')
mustInclude(perimeterDoc, 'Issue #16, Healthcheck/Dashboard real-source hardening, stays after perimeter hardening.', 'security perimeter document')
mustInclude(runtimeConfig, 'docs/security-perimeter.md', 'runtime config document')
mustInclude(runtimeConfig, 'internet-public: unsupported', 'runtime config document')
mustInclude(runtimeConfig, 'npm run verify:perimeter-policy', 'runtime config document')

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

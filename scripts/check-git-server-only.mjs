#!/usr/bin/env node
/** Static guardrail for Issue #40.4 Git frontend server-only/read-only integration. */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  adapter: join(repoRoot, 'apps/web/src/modules/git/api/git-http.ts'),
  page: join(repoRoot, 'apps/web/src/app/git/page.tsx'),
  middleware: join(repoRoot, 'apps/web/src/middleware.ts'),
  fixture: join(repoRoot, 'apps/web/src/modules/git/view-models/git-surface.fixture.ts'),
  moduleAgents: join(repoRoot, 'apps/web/src/modules/git/AGENTS.md'),
  modulesAgents: join(repoRoot, 'apps/web/src/modules/AGENTS.md'),
  nav: join(repoRoot, 'apps/web/src/shared/ui/navigation/SidebarNav.tsx'),
  css: join(repoRoot, 'apps/web/src/app/globals.css'),
  runtimeConfig: join(repoRoot, 'docs/runtime-config.md'),
  frontendSpec: join(repoRoot, 'docs/frontend-ui-spec.md'),
  handoff: join(repoRoot, 'docs/frontend-implementation-handoff.md'),
  openspec: join(repoRoot, 'openspec/issue-40-4-git-frontend-readonly.md'),
  openspecSelector: join(repoRoot, 'openspec/issue-40-5-git-controlled-selector-plan.md'),
  engram: join(repoRoot, '.engram/issue-40-4-git-frontend-readonly.md'),
  engramSelector: join(repoRoot, '.engram/issue-40-5-git-controlled-selector-planning-closeout.md'),
}
const failures = []
function read(pathName, label) {
  if (!existsSync(pathName)) {
    failures.push(`missing ${label}: ${pathName}`)
    return ''
  }
  return readFileSync(pathName, 'utf8')
}
function mustInclude(text, snippet, label) { if (!text.includes(snippet)) failures.push(`${label} must include: ${snippet}`) }
function mustNotInclude(text, snippet, label) { if (text.includes(snippet)) failures.push(`${label} must not include: ${snippet}`) }

const packageJsonText = read(paths.packageJson, 'package.json')
const adapter = read(paths.adapter, 'git server-only adapter')
const page = read(paths.page, 'git page')
const middleware = read(paths.middleware, 'Git route middleware')
const fixture = read(paths.fixture, 'git fallback fixture')
const moduleAgents = read(paths.moduleAgents, 'git module AGENTS')
const modulesAgents = read(paths.modulesAgents, 'modules AGENTS')
const nav = read(paths.nav, 'SidebarNav')
const css = read(paths.css, 'globals.css')
const runtimeConfig = read(paths.runtimeConfig, 'runtime config docs')
const frontendSpec = read(paths.frontendSpec, 'frontend UI spec')
const handoff = read(paths.handoff, 'frontend implementation handoff')
const openspec = read(paths.openspec, 'Issue 40.4 OpenSpec')
const openspecSelector = read(paths.openspecSelector, 'Issue 40.5 OpenSpec')
const engram = read(paths.engram, 'Issue 40.4 Engram note')
const engramSelector = read(paths.engramSelector, 'Issue 40.5 Engram note')

let packageJson
try { packageJson = JSON.parse(packageJsonText) } catch { failures.push('package.json must be valid JSON') }
if (packageJson?.scripts?.['verify:git-server-only'] !== 'node scripts/check-git-server-only.mjs') failures.push('package.json must expose verify:git-server-only')

for (const snippet of [
  "import 'server-only'",
  "GIT_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'",
  "parsed.protocol !== 'http:'",
  "parsed.protocol !== 'https:'",
  "cache: 'no-store'",
  '/api/v1/git/repos',
  '/commits?limit=12',
  '/branches',
  '/diff',
]) mustInclude(adapter, snippet, 'git adapter')

for (const forbidden of [
  'NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL',
  'process.env.NEXT_PUBLIC',
  'path=',
  'url=',
  'remote=',
  'command=',
  'ref=',
  'branch=',
  'revspec=',
  'checkout',
  'reset',
  'commit --',
  'push',
  'pull',
  'stash',
  'merge',
  'rebase',
]) mustNotInclude(adapter, forbidden, 'git adapter')

for (const snippet of [
  "export const dynamic = 'force-dynamic'",
  'fetchGitRepos()',
  'Promise.all(repoIndex.repos.map(async (repo) =>',
  'fetchGitCommits(repo.repo_id)',
  'fetchGitBranches(repo.repo_id)',
  'type GitRepoCardSnapshot',
  'RepoStatusCard',
  'Ramas disponibles',
  'Último commit',
  'Mensaje del commit',
  '<details className="git-commit-message"',
  'Sin operaciones mutables',
  'Repos Git',
  'Solo lectura',
  'Estado local por repo',
  'Último commit desplegable',
]) mustInclude(page, snippet, 'git page')

for (const forbidden of [
  "'use client'",
  'process.env',
  'NEXT_PUBLIC',
  'MUGIWARA_CONTROL_PANEL_API_URL',
  '/api/v1/git',
  'Traceback',
  'Stack trace',
  'stdout',
  'stderr',
  '/srv/',
  '/home/',
  '.env',
  'checkout',
  'reset',
  'push',
  'pull',
  ' fetch(',
  'stash',
  'merge',
  'rebase',
  '<input',
  '<textarea',
  '<form',
  'name="path"',
  'name="ref"',
  'name="branch"',
  'name="revspec"',
]) mustNotInclude(page, forbidden, 'git page')

for (const snippet of [
  'NextResponse.redirect(canonicalUrl)',
  "matcher: ['/git']",
  "GIT_CANONICAL_PATH = '/git'",
  "GIT_ALLOWED_SEARCH_PARAMS = new Set(['repo_id', 'sha'])",
  "GIT_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'",
  'GIT_REPO_ID_PATTERN',
  'GIT_FULL_SHA_PATTERN',
  'hasDuplicateParam(request, key)',
  'hasUnsafeGitSearchParams(request)',
  'process.env[GIT_API_BASE_URL_ENV]',
  "fetch(`${baseUrl}${path}`",
  '/api/v1/git/repos',
  '/commits?limit=12',
  "canonicalUrl.search = ''",
]) mustInclude(middleware, snippet, 'Git route middleware')

for (const forbidden of ['path=', 'ref=', 'branch=', 'revspec=', 'command=', 'url=', 'NEXT_PUBLIC']) {
  mustNotInclude(middleware, forbidden, 'Git route middleware')
}

for (const forbidden of ['Traceback', 'Stack trace', 'stdout', 'stderr', '/srv/', '/home/', 'token', 'secret', 'password']) {
  mustNotInclude(fixture.toLowerCase(), forbidden.toLowerCase(), 'git fallback fixture')
}

mustInclude(nav, "{ href: '/git', label: 'Repos Git'", 'SidebarNav')
mustInclude(css, '.git-diff-pre', 'globals.css')
mustInclude(css, 'overflow-x: auto', 'globals.css')
mustInclude(css, '@media (max-width: 720px)', 'globals.css')
mustInclude(moduleAgents, 'server-only', 'git module AGENTS')
mustInclude(moduleAgents, 'sin paths', 'git module AGENTS')
mustInclude(modulesAgents, 'git', 'modules AGENTS')

for (const doc of [runtimeConfig, frontendSpec, handoff, openspec, openspecSelector, engram, engramSelector]) {
  mustInclude(doc, 'verify:git-server-only', 'Git docs/OpenSpec/Engram')
  mustInclude(doc, 'Repos Git', 'Git docs/OpenSpec/Engram')
  mustInclude(doc, 'server-only', 'Git docs/OpenSpec/Engram')
}

for (const doc of [runtimeConfig, frontendSpec, handoff]) {
  mustInclude(doc, 'Estado local por repo', 'Git status cards docs')
  mustInclude(doc, 'Último commit', 'Git status cards docs')
  mustInclude(doc, 'repo', 'Git status cards docs')
}

for (const doc of [openspecSelector, engramSelector]) {
  mustInclude(doc, 'Selección controlada', 'Git historical selector docs/OpenSpec/Engram')
  mustInclude(doc, 'repo_id', 'Git historical selector docs/OpenSpec/Engram')
  mustInclude(doc, 'SHA', 'Git historical selector docs/OpenSpec/Engram')
}

if (failures.length > 0) {
  console.error('Git server-only frontend check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Git server-only frontend check passed.')

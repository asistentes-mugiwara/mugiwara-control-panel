#!/usr/bin/env node
/**
 * Static guardrail for Issue #40 Git control backend policy.
 *
 * Keeps Git control as a backend-owned read-only registry/status/commits/branches
 * surface, not a filesystem browser or Git console.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  gitModule: join(repoRoot, 'apps/api/src/modules/git_control'),
  mainPy: join(repoRoot, 'apps/api/src/main.py'),
  tests: join(repoRoot, 'apps/api/tests/test_git_control_api.py'),
  apiModulesDoc: join(repoRoot, 'docs/api-modules.md'),
  readModelsDoc: join(repoRoot, 'docs/read-models.md'),
  runtimeConfigDoc: join(repoRoot, 'docs/runtime-config.md'),
}

const failures = []

function read(pathName, label) {
  if (!existsSync(pathName)) {
    failures.push(`missing ${label} at ${pathName}`)
    return ''
  }
  return readFileSync(pathName, 'utf8')
}

function mustInclude(text, snippet, label) {
  if (!text.includes(snippet)) failures.push(`${label} must include: ${snippet}`)
}

function listPythonFiles(dir) {
  if (!existsSync(dir)) {
    failures.push(`missing git_control module directory at ${dir}`)
    return []
  }
  const files = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      if (entry !== '__pycache__') files.push(...listPythonFiles(fullPath))
    } else if (entry.endsWith('.py')) {
      files.push(fullPath)
    }
  }
  return files
}

const packageJsonText = read(paths.packageJson, 'package.json')
const mainPy = read(paths.mainPy, 'FastAPI main')
const domainPy = read(join(paths.gitModule, 'domain.py'), 'git_control domain')
const registryPy = read(join(paths.gitModule, 'registry.py'), 'git_control registry')
const adapterPy = read(join(paths.gitModule, 'git_adapter.py'), 'git_control git adapter')
const servicePy = read(join(paths.gitModule, 'service.py'), 'git_control service')
const routerPy = read(join(paths.gitModule, 'router.py'), 'git_control router')
const testsPy = read(paths.tests, 'git_control tests')
const apiModulesDoc = read(paths.apiModulesDoc, 'API modules doc')
const readModelsDoc = read(paths.readModelsDoc, 'read models doc')
const runtimeConfigDoc = read(paths.runtimeConfigDoc, 'runtime config doc')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson?.scripts?.['verify:git-control-backend-policy'] !== 'node scripts/check-git-control-backend-policy.mjs') {
  failures.push('package.json must expose verify:git-control-backend-policy')
}

mustInclude(mainPy, 'from .modules.git_control.router import router as git_control_router', 'FastAPI main')
mustInclude(mainPy, 'app.include_router(git_control_router)', 'FastAPI main')
mustInclude(routerPy, "router = APIRouter(prefix='/api/v1/git', tags=['git_control'])", 'git_control router')
mustInclude(routerPy, "@router.get('/repos')", 'git_control router')
mustInclude(routerPy, "@router.get('/repos/{repo_id}/status')", 'git_control router')
mustInclude(routerPy, "@router.get('/repos/{repo_id}/commits')", 'git_control router')
mustInclude(routerPy, "@router.get('/repos/{repo_id}/branches')", 'git_control router')
mustInclude(routerPy, "resource='git.repo_index'", 'git_control router')
mustInclude(routerPy, "resource='git.repo_status'", 'git_control router')
mustInclude(routerPy, "resource='git.commit_list'", 'git_control router')
mustInclude(routerPy, "resource='git.branch_list'", 'git_control router')
mustInclude(routerPy, "'read_only': True", 'git_control router')
mustInclude(routerPy, "'sanitized': True", 'git_control router')
mustInclude(routerPy, "'source': GIT_CONTROL_SOURCE_LABEL", 'git_control router')
mustInclude(routerPy, 'Git repository is not configured.', 'git_control router')

const requiredDomainSnippets = [
  "GIT_CONTROL_SOURCE_LABEL = 'backend-owned-git-registry'",
  'GIT_COMMAND_TIMEOUT_SECONDS',
  'GIT_MINIMAL_ENV',
  "'GIT_CONFIG_GLOBAL': '/dev/null'",
  "'GIT_CONFIG_SYSTEM': '/dev/null'",
  "'GIT_CONFIG_NOSYSTEM': '1'",
  'GIT_SAFE_CONFIG_ARGS',
  'core.fsmonitor=false',
  'core.hooksPath=/dev/null',
  'GIT_COMMITS_DEFAULT_LIMIT',
  'GIT_COMMITS_MAX_LIMIT',
  'GIT_CURSOR_PATTERN',
  'GIT_SHA_PATTERN',
  "READ_ONLY_GIT_COMMANDS = frozenset({'status', 'log', 'branch'})",
  'FORBIDDEN_GIT_COMMANDS = frozenset',
  "'checkout'",
  "'reset'",
  "'commit'",
  "'push'",
  "'pull'",
  "'fetch'",
  "'stash'",
  "'merge'",
  "'rebase'",
]
for (const snippet of requiredDomainSnippets) mustInclude(domainPy, snippet, 'git_control domain')

const requiredRegistrySnippets = [
  'class GitRepoRegistry',
  'GitRepoDefinition',
  'default_git_repo_registry',
  "repo_id='mugiwara-control-panel'",
  "repo_id='crew-core'",
  "repo_id='vault'",
  '_REPO_ID_PATTERN',
]
for (const snippet of requiredRegistrySnippets) mustInclude(registryPy, snippet, 'git_control registry')

const requiredAdapterSnippets = [
  'subprocess.run(',
  'cwd=repo_path',
  'timeout=GIT_COMMAND_TIMEOUT_SECONDS',
  'env=GIT_MINIMAL_ENV',
  'shell=False',
  'check=True',
  'stderr=subprocess.PIPE',
  "'--no-optional-locks'",
  '*GIT_SAFE_CONFIG_ARGS',
  '_extract_git_command',
  "'status'",
  "'log'",
  "'branch'",
  "'--porcelain=v1'",
  "'--branch'",
  "'--untracked-files=all'",
  "'--no-renames'",
  "'--max-count={limit}'",
  "'--skip={offset}'",
  "'--format=%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%cI%x1f%s%x1f%B%x1e'",
  "'--format=%(refname:short)%00%(HEAD)%00%(objectname)'",
  'READ_ONLY_GIT_COMMANDS',
  'FORBIDDEN_GIT_COMMANDS',
]
for (const snippet of requiredAdapterSnippets) mustInclude(adapterPy, snippet, 'git_control adapter')

mustInclude(servicePy, 'class GitControlService', 'git_control service')
mustInclude(servicePy, 'GitRepoNotFound', 'git_control service')

const allModuleText = listPythonFiles(paths.gitModule)
  .map((filePath) => [filePath, readFileSync(filePath, 'utf8')])

const forbiddenEverywhere = [
  { pattern: /shell\s*=\s*True/, label: 'shell=True' },
  { pattern: /\bos\.system\s*\(/, label: 'os.system' },
  { pattern: /\bexec\s*\(/, label: 'exec()' },
  { pattern: /\beval\s*\(/, label: 'eval()' },
  { pattern: /\b(os\.listdir|os\.scandir|os\.walk|glob\.glob|Path\.home|Path\.cwd|\.rglob)\s*\(/, label: 'filesystem discovery' },
  { pattern: /\b(requests|httpx|urllib\.request)\b/, label: 'generic network fetch' },
]
for (const [filePath, text] of allModuleText) {
  for (const { pattern, label } of forbiddenEverywhere) {
    if (pattern.test(text)) failures.push(`git_control backend must not contain ${label}: ${filePath}`)
  }
}

const adapterLines = adapterPy.split('\n')
const forbiddenGitInvocationPatterns = [
  /['"]checkout['"]/, /['"]reset['"]/, /['"]commit['"]/, /['"]push['"]/, /['"]pull['"]/, /['"]fetch['"]/, /['"]stash['"]/, /['"]merge['"]/, /['"]rebase['"]/
]
for (let index = 0; index < adapterLines.length; index += 1) {
  const line = adapterLines[index]
  if (forbiddenGitInvocationPatterns.some((pattern) => pattern.test(line)) && !line.includes('FORBIDDEN_GIT_COMMANDS')) {
    failures.push(`git_control adapter must not invoke forbidden Git command on line ${index + 1}`)
  }
}

const forbiddenRouterPatterns = [
  /\b(path|url|remote|command|cwd|ref|revspec)\s*:\s*str/,
  /\{repo_id:path\}/,
]
for (const pattern of forbiddenRouterPatterns) {
  if (pattern.test(routerPy)) failures.push(`git_control router must not expose client-controlled path/url/command/revspec inputs: ${pattern}`)
}

const requiredTestSnippets = [
  'test_git_repos_lists_only_allowlisted_sanitized_repositories',
  'test_git_repo_status_reports_dirty_without_file_names_or_paths',
  'test_git_repo_status_neutralizes_local_fsmonitor_hook',
  "'core.fsmonitor'",
  'assert not marker.exists()',
  'test_git_unknown_repo_id_returns_sanitized_not_found_without_echoing_input',
  'test_git_repo_status_degrades_safely_for_unreadable_or_non_git_repo',
  'test_git_commits_lists_recent_commits_with_mugiwara_trailers_and_safe_cursor',
  'test_git_commits_do_not_expose_sensitive_commit_body_while_extracting_trailers',
  'SYNTHETIC-SECRET-COMMIT-BODY-MARKER',
  "assert 'body' not in commit",
  'Mugiwara-Agent: zoro',
  'Signed-off-by: zoro <asistentes.mugiwara@gmail.com>',
  'test_git_branches_lists_local_branches_only_without_remotes_or_paths',
  'test_git_commits_reject_invalid_limit_and_malicious_cursor_without_echo',
  'HEAD..main:/srv/private-token',
  'test_git_commits_unknown_repo_and_degraded_repo_are_sanitized',
  'test_git_read_model_invocations_stay_allowlisted_and_hardened',
  '_assert_no_leakage',
  '.env',
  'super-secret-value',
]
for (const snippet of requiredTestSnippets) mustInclude(testsPy, snippet, 'git_control tests')

mustInclude(apiModulesDoc, 'GET /api/v1/git/repos', 'API modules doc')
mustInclude(apiModulesDoc, 'GET /api/v1/git/repos/{repo_id}/status', 'API modules doc')
mustInclude(apiModulesDoc, 'backend-owned registry', 'API modules doc')
mustInclude(readModelsDoc, 'git.repo_index', 'read models doc')
mustInclude(readModelsDoc, 'git.repo_status', 'read models doc')
mustInclude(readModelsDoc, 'git.commit_list', 'read models doc')
mustInclude(readModelsDoc, 'git.branch_list', 'read models doc')
mustInclude(readModelsDoc, 'El cuerpo libre del commit no forma parte del contrato público', 'read models doc')
mustInclude(runtimeConfigDoc, 'Git control backend', 'runtime config doc')

if (failures.length > 0) {
  console.error('Git control backend policy check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Git control backend policy check passed.')

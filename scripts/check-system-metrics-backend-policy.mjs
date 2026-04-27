#!/usr/bin/env node
/**
 * Static guardrail for Issue #36.1 system metrics backend policy.
 *
 * Keeps system metrics as a fixed read-only backend endpoint, not a host console.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  systemModule: join(repoRoot, 'apps/api/src/modules/system'),
  mainPy: join(repoRoot, 'apps/api/src/main.py'),
  systemTests: join(repoRoot, 'apps/api/tests/test_system_metrics_api.py'),
  apiModulesDoc: join(repoRoot, 'docs/api-modules.md'),
  readModelsDoc: join(repoRoot, 'docs/read-models.md'),
}

const failures = []

function read(pathName, label) {
  if (!existsSync(pathName)) {
    failures.push(`missing ${label} at ${pathName}`)
    return ''
  }
  return readFileSync(pathName, 'utf8')
}

function listPythonFiles(dir) {
  if (!existsSync(dir)) {
    failures.push(`missing system metrics module directory at ${dir}`)
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

function mustInclude(text, snippet, label) {
  if (!text.includes(snippet)) failures.push(`${label} must include: ${snippet}`)
}

const packageJsonText = read(paths.packageJson, 'package.json')
const mainPy = read(paths.mainPy, 'FastAPI main')
const servicePy = read(join(paths.systemModule, 'service.py'), 'system metrics service')
const routerPy = read(join(paths.systemModule, 'router.py'), 'system metrics router')
const testsPy = read(paths.systemTests, 'system metrics tests')
const apiModulesDoc = read(paths.apiModulesDoc, 'API modules doc')
const readModelsDoc = read(paths.readModelsDoc, 'read models doc')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson?.scripts?.['verify:system-metrics-backend-policy'] !== 'node scripts/check-system-metrics-backend-policy.mjs') {
  failures.push('package.json must expose verify:system-metrics-backend-policy')
}

mustInclude(mainPy, 'from .modules.system.router import router as system_router', 'FastAPI main')
mustInclude(mainPy, 'app.include_router(system_router)', 'FastAPI main')
mustInclude(routerPy, "router = APIRouter(prefix='/api/v1/system', tags=['system'])", 'system metrics router')
mustInclude(routerPy, "@router.get('/metrics')", 'system metrics router')
mustInclude(routerPy, "resource='system.metrics'", 'system metrics router')
mustInclude(routerPy, "'read_only': True", 'system metrics router')
mustInclude(routerPy, "'sanitized': True", 'system metrics router')
mustInclude(routerPy, "'disk_target': SYSTEM_METRICS_DISK_TARGET_LABEL", 'system metrics router')

const requiredServiceSnippets = [
  "SYSTEM_METRICS_DISK_TARGET = '/'",
  "SYSTEM_METRICS_DISK_TARGET_LABEL = 'fastapi-visible-root-filesystem'",
  "Path('/proc/meminfo').read_text(encoding='utf-8')",
  "Path('/proc/uptime').read_text(encoding='utf-8')",
  'shutil.disk_usage(SYSTEM_METRICS_DISK_TARGET)',
  "values_kb['MemTotal']",
  "values_kb['MemAvailable']",
  "source_state = 'live' if all(metric.source_state == 'live'",
]
for (const snippet of requiredServiceSnippets) mustInclude(servicePy, snippet, 'system metrics service')

const forbiddenSourcePatterns = [
  { pattern: /\bimport\s+subprocess\b/, label: 'import subprocess' },
  { pattern: /\bfrom\s+subprocess\s+import\b/, label: 'from subprocess import' },
  { pattern: /\bsubprocess\s*\./, label: 'subprocess usage' },
  { pattern: /\bos\.system\s*\(/, label: 'os.system' },
  { pattern: /\bshell\s*=\s*True\b/, label: 'shell=True' },
  { pattern: /\bexec\s*\(/, label: 'exec()' },
  { pattern: /\beval\s*\(/, label: 'eval()' },
  { pattern: /\b(command|path|mount|device|url|method|host|target)\s*:\s*str/, label: 'client-controlled host selector parameter' },
  { pattern: /\b(os\.listdir|os\.scandir|os\.walk|glob\.glob|Path\.home|Path\.cwd|\.rglob)\s*\(/, label: 'filesystem discovery' },
  { pattern: /\b(requests|httpx|urllib\.request)\b/, label: 'generic network fetch' },
]

for (const filePath of listPythonFiles(paths.systemModule)) {
  const text = readFileSync(filePath, 'utf8')
  for (const { pattern, label } of forbiddenSourcePatterns) {
    if (pattern.test(text)) failures.push(`system metrics backend must not contain ${label}: ${filePath}`)
  }
}

const requiredTestSnippets = [
  'test_system_metrics_returns_sanitized_allowlisted_snapshot',
  'MemTotal: 1000 kB',
  'MemAvailable: 250 kB',
  'test_system_metrics_degrades_each_source_without_raw_errors_or_host_paths',
  'test_system_metrics_does_not_accept_or_echo_client_controlled_targets',
  '_assert_no_system_metrics_leakage',
]
for (const snippet of requiredTestSnippets) mustInclude(testsPy, snippet, 'system metrics tests')

mustInclude(apiModulesDoc, 'GET /api/v1/system/metrics', 'API modules doc')
mustInclude(apiModulesDoc, 'fastapi-visible-root-filesystem', 'API modules doc')
mustInclude(readModelsDoc, 'system.metrics', 'read models doc')
mustInclude(readModelsDoc, 'MemTotal - MemAvailable', 'read models doc')

if (failures.length > 0) {
  console.error('System metrics backend policy check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('System metrics backend policy check passed.')

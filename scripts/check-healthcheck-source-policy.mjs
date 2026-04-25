#!/usr/bin/env node
/**
 * Static guardrail for Phase 15.2c Healthcheck source policy.
 *
 * Inputs: Healthcheck backend module source, package.json and source-policy docs.
 * Output: exits non-zero if Healthcheck grows generic host-console patterns or
 * if manifest ownership/freshness policy docs disappear. Read-only.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  healthcheckModule: join(repoRoot, 'apps/api/src/modules/healthcheck'),
  sourcePolicyDoc: join(repoRoot, 'docs/healthcheck-source-policy.md'),
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
    failures.push(`missing Healthcheck module directory at ${dir}`)
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
  if (!text.includes(snippet)) {
    failures.push(`${label} must include: ${snippet}`)
  }
}

const packageJsonText = read(paths.packageJson, 'package.json')
const sourcePolicyDoc = read(paths.sourcePolicyDoc, 'Healthcheck source policy document')
const apiModulesDoc = read(paths.apiModulesDoc, 'API modules document')
const readModelsDoc = read(paths.readModelsDoc, 'read models document')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson && packageJson.scripts?.['verify:healthcheck-source-policy'] !== 'node scripts/check-healthcheck-source-policy.mjs') {
  failures.push('package.json must expose verify:healthcheck-source-policy')
}

const forbiddenHostConsolePatterns = [
  { pattern: /\bimport\s+subprocess\b/, label: 'import subprocess' },
  { pattern: /\bfrom\s+subprocess\s+import\b/, label: 'from subprocess import' },
  { pattern: /\bsubprocess\s*\./, label: 'subprocess usage' },
  { pattern: /\bos\.system\s*\(/, label: 'os.system' },
  { pattern: /\bshell\s*=\s*True\b/, label: 'shell=True' },
  { pattern: /\bexec\s*\(/, label: 'exec()' },
  { pattern: /\beval\s*\(/, label: 'eval()' },
  { pattern: /\bcommand\s*=/, label: 'command parameter' },
  { pattern: /\bimport\s+requests\b/, label: 'import requests' },
  { pattern: /\brequests\.(get|post|put|patch|delete|request)\s*\(/, label: 'requests generic URL fetch' },
  { pattern: /\bimport\s+httpx\b/, label: 'import httpx' },
  { pattern: /\bhttpx\.(get|post|put|patch|delete|request)\s*\(/, label: 'httpx generic URL fetch' },
  { pattern: /\burllib\.request\b/, label: 'urllib.request generic URL fetch' },
  { pattern: /\bimport\s+glob\b/, label: 'import glob' },
  { pattern: /\bglob\.glob\s*\(/, label: 'glob filesystem discovery' },
  { pattern: /\bos\.(listdir|scandir|walk)\s*\(/, label: 'generic filesystem discovery' },
  { pattern: /\bPath\.(home|cwd)\s*\(/, label: 'ambient Path root discovery' },
  { pattern: /\.rglob\s*\(/, label: 'recursive filesystem discovery' },
  { pattern: /\bopen\s*\(/, label: 'generic file open' },
]

const requiredRegistrySnippets = [
  '_SENSITIVE_TEXT_MARKERS',
  '_SANITIZED_TEXT_DEFAULTS',
  'label=HEALTHCHECK_SOURCE_LABELS[source_id]',
  '_safe_text_field',
  'Resumen Healthcheck saneado por política de seguridad.',
  'Detalle Healthcheck omitido por política de seguridad.',
]

for (const snippet of requiredRegistrySnippets) {
  const registryText = read(join(paths.healthcheckModule, 'registry.py'), 'Healthcheck source registry')
  mustInclude(registryText, snippet, 'Healthcheck source registry')
}

for (const filePath of listPythonFiles(paths.healthcheckModule)) {
  const text = readFileSync(filePath, 'utf8')
  for (const { pattern, label } of forbiddenHostConsolePatterns) {
    if (pattern.test(text)) {
      failures.push(`Healthcheck source must not contain ${label}: ${filePath}`)
    }
  }
}

const requiredDocSnippets = [
  'No generic host console',
  'Text field sanitization',
  'ignores adapter-provided labels',
  'HEALTHCHECK_SOURCE_LABELS[source_id]',
  '`summary`, `warning_text`, `source_label` and `freshness_label`',
  'generic filesystem discovery or reads',
  'Franky-owned operational source',
  'shared manifest registry, not Zoro profile-local `cronjob list`',
  '`vault-sync`: warn after 90 minutes, fail after 360 minutes',
  '`backup-health`: warn after 1800 minutes, fail after 4320 minutes',
  '`cronjobs`: warn after 180 minutes, fail after 720 minutes',
  '`hermes-gateways` and `gateway.<mugiwara-slug>`: warn after 15 minutes, fail after 60 minutes',
  '`project-health`: warn after 120 minutes, fail after 480 minutes',
  'Phase 15.3b also allows the fixed `backup-health` manifest reader',
  'Phase 15.3b reads a fixed local backup status manifest and exposes only timestamp/result/checksum/retention-derived summary fields',
  'These phases still do not add project-health, gateway or cronjob reads',
  'do not include `stdout`, `stderr`, `raw_output`, `command`, `traceback`, `pid`, `unit_content`, `journal`, absolute host paths, `backup_path`, `included_path`, `prompt_body`, `chat_id`, delivery targets, tokens, cookies, credentials, `.env`, Git diffs, untracked file lists or internal remotes',
]

for (const snippet of requiredDocSnippets) {
  mustInclude(sourcePolicyDoc, snippet, 'Healthcheck source policy document')
}

mustInclude(apiModulesDoc, 'npm run verify:healthcheck-source-policy', 'API modules document')
mustInclude(apiModulesDoc, 'manifest ownership and freshness thresholds', 'API modules document')
mustInclude(readModelsDoc, 'Phase 15.2c adds static guardrails, manifest ownership and freshness thresholds', 'read models document')
mustInclude(readModelsDoc, 'docs/healthcheck-source-policy.md', 'read models document')

if (failures.length > 0) {
  console.error('Healthcheck source policy check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Healthcheck source policy check passed')

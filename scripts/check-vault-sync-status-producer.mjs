#!/usr/bin/env node
/**
 * Static guardrail for the Phase 18.1 vault-sync status producer.
 *
 * It keeps the producer narrow: fixed Franky-owned sync script, fixed manifest
 * output through npm run write:vault-sync-status, atomic write semantics,
 * non-public permissions, no stdout/stderr/log/path serialization, and no
 * systemd runner/timer in this phase.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  producer: join(repoRoot, 'scripts/write-vault-sync-status.py'),
  policyDoc: join(repoRoot, 'docs/healthcheck-source-policy.md'),
  readModelsDoc: join(repoRoot, 'docs/read-models.md'),
  apiModulesDoc: join(repoRoot, 'docs/api-modules.md'),
  phaseSpec: join(repoRoot, 'openspec/phase-18-1-vault-sync-status-producer.md'),
}

const failures = []

function read(pathName, label) {
  if (!existsSync(pathName)) {
    failures.push(`missing ${label}: ${pathName}`)
    return ''
  }
  return readFileSync(pathName, 'utf8')
}

function mustInclude(text, snippet, label) {
  if (!text.includes(snippet)) failures.push(`${label} must include: ${snippet}`)
}

function mustNotInclude(text, pattern, label, description) {
  if (pattern.test(text)) failures.push(`${label} must not include ${description}`)
}

const packageJsonText = read(paths.packageJson, 'package.json')
const producer = read(paths.producer, 'vault-sync status producer')
const policyDoc = read(paths.policyDoc, 'Healthcheck source policy document')
const readModelsDoc = read(paths.readModelsDoc, 'read models document')
const apiModulesDoc = read(paths.apiModulesDoc, 'API modules document')
const phaseSpec = read(paths.phaseSpec, 'Phase 18.1 OpenSpec')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson && packageJson.scripts?.['write:vault-sync-status'] !== 'python3 scripts/write-vault-sync-status.py') {
  failures.push('package.json must expose write:vault-sync-status with python3')
}

if (packageJson && packageJson.scripts?.['verify:vault-sync-status-producer'] !== 'node scripts/check-vault-sync-status-producer.mjs') {
  failures.push('package.json must expose verify:vault-sync-status-producer')
}

const requiredProducerSnippets = [
  "DEFAULT_SYNC_SCRIPT = Path('/srv/crew-core/scripts/vault-sync.sh')",
  "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/vault-sync-status.json')",
  "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'last_success_at')",
  "DEGRADED_MANIFEST_KEYS = ('status', 'result', 'updated_at')",
  'stdout=subprocess.DEVNULL',
  'stderr=subprocess.DEVNULL',
  'stdin=subprocess.DEVNULL',
  "os.replace(temp_path, output)",
  "os.chmod(output, 0o640)",
  "os.chmod(output.parent, 0o750)",
  '_fsync_directory(output.parent)',
]

for (const snippet of requiredProducerSnippets) {
  mustInclude(producer, snippet, 'vault-sync status producer')
}

mustNotInclude(producer, /raw_output|traceback|remote\b|branch\b|\.env|token|credential/i, 'vault-sync status producer', 'raw host detail serialization language')
mustNotInclude(producer, /shell\s*=\s*True|os\.system\s*\(|\beval\s*\(|\bexec\s*\(/, 'vault-sync status producer', 'generic shell/eval execution')

for (const [text, label] of [
  [policyDoc, 'Healthcheck source policy document'],
  [readModelsDoc, 'read models document'],
  [apiModulesDoc, 'API modules document'],
  [phaseSpec, 'Phase 18.1 OpenSpec'],
]) {
  mustInclude(text, 'scripts/write-vault-sync-status.py', label)
  mustInclude(text, 'npm run write:vault-sync-status', label)
  mustInclude(text, '/srv/crew-core/runtime/healthcheck/vault-sync-status.json', label)
  mustInclude(text, 'no unit/timer in Phase 18.1', label)
}

if (failures.length > 0) {
  console.error('Vault-sync status producer check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Vault-sync status producer check passed')

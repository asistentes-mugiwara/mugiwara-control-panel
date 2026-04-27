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
  projectHealthProducer: join(repoRoot, 'scripts/write-project-health-status.py'),
  gatewayStatusProducer: join(repoRoot, 'scripts/write-gateway-status.py'),
  cronjobsStatusProducer: join(repoRoot, 'scripts/write-cronjobs-status.py'),
  vaultSyncStatusProducer: join(repoRoot, 'scripts/write-vault-sync-status.py'),
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
const projectHealthProducer = read(paths.projectHealthProducer, 'project-health manifest producer')
const gatewayStatusProducer = read(paths.gatewayStatusProducer, 'gateway status manifest producer')
const cronjobsStatusProducer = read(paths.cronjobsStatusProducer, 'cronjobs status manifest producer')
const vaultSyncStatusProducer = read(paths.vaultSyncStatusProducer, 'vault-sync status manifest producer')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson && packageJson.scripts?.['verify:healthcheck-source-policy'] !== 'node scripts/check-healthcheck-source-policy.mjs') {
  failures.push('package.json must expose verify:healthcheck-source-policy')
}

if (packageJson && packageJson.scripts?.['write:project-health-status'] !== 'python3 scripts/write-project-health-status.py') {
  failures.push('package.json must expose write:project-health-status with python3')
}

if (packageJson && packageJson.scripts?.['write:gateway-status'] !== 'python3 scripts/write-gateway-status.py') {
  failures.push('package.json must expose write:gateway-status with python3')
}

if (packageJson && packageJson.scripts?.['verify:gateway-status-runner'] !== 'node scripts/check-gateway-status-runner.mjs') {
  failures.push('package.json must expose verify:gateway-status-runner')
}

if (packageJson && packageJson.scripts?.['write:cronjobs-status'] !== 'python3 scripts/write-cronjobs-status.py') {
  failures.push('package.json must expose write:cronjobs-status with python3')
}

if (packageJson && packageJson.scripts?.['write:vault-sync-status'] !== 'python3 scripts/write-vault-sync-status.py') {
  failures.push('package.json must expose write:vault-sync-status with python3')
}

if (packageJson && packageJson.scripts?.['verify:vault-sync-status-producer'] !== 'node scripts/check-vault-sync-status-producer.mjs') {
  failures.push('package.json must expose verify:vault-sync-status-producer')
}

if (packageJson && packageJson.scripts?.['verify:cronjobs-status-runner'] !== 'node scripts/check-cronjobs-status-runner.mjs') {
  failures.push('package.json must expose verify:cronjobs-status-runner')
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

const sourceAdaptersText = read(join(paths.healthcheckModule, 'source_adapters.py'), 'Healthcheck source adapters')
const requiredGatewayAdapterSnippets = [
  "GATEWAY_STATUS_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/gateway-status.json')",
  'class GatewayStatusManifestAdapter',
  "global_source_id = 'hermes-gateways'",
  'MUGIWARA_GATEWAY_SOURCE_IDS',
  "'source_label': 'Gateway safe manifest'",
]

for (const snippet of requiredGatewayAdapterSnippets) {
  mustInclude(sourceAdaptersText, snippet, 'gateway status manifest adapter')
}

const requiredCronjobsAdapterSnippets = [
  "CRONJOBS_STATUS_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/cronjobs-status.json')",
  'class CronjobsManifestAdapter',
  "source_id = 'cronjobs'",
  "'source_label': 'Cronjobs safe manifest'",
  "job.get('last_run_at')",
  "job.get('last_status')",
  "job.get('criticality')",
]

for (const snippet of requiredCronjobsAdapterSnippets) {
  mustInclude(sourceAdaptersText, snippet, 'cronjobs status manifest adapter')
}

for (const filePath of listPythonFiles(paths.healthcheckModule)) {
  const text = readFileSync(filePath, 'utf8')
  for (const { pattern, label } of forbiddenHostConsolePatterns) {
    if (pattern.test(text)) {
      failures.push(`Healthcheck source must not contain ${label}: ${filePath}`)
    }
  }
}

const requiredProjectHealthProducerSnippets = [
  "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/project-health-status.json')",
  "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'workspace_clean', 'main_branch', 'remote_synced')",
  "os.replace(temp_path, output)",
  "os.chmod(output, 0o640)",
  "os.chmod(output.parent, 0o750)",
  "'git', '-C', str(repo)",
]

for (const snippet of requiredProjectHealthProducerSnippets) {
  mustInclude(projectHealthProducer, snippet, 'project-health manifest producer')
}

const requiredGatewayStatusProducerSnippets = [
  "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/gateway-status.json')",
  "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'gateways')",
  "SAFE_GATEWAY_ENTRY_KEYS = ('active',)",
  "['systemctl', '--user', 'is-active', unit_name]",
  "os.replace(temp_path, output)",
  "os.chmod(output, 0o640)",
  "os.chmod(output.parent, 0o750)",
]

for (const snippet of requiredGatewayStatusProducerSnippets) {
  mustInclude(gatewayStatusProducer, snippet, 'gateway status manifest producer')
}

const requiredCronjobsStatusProducerSnippets = [
  "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/cronjobs-status.json')",
  "DEFAULT_PROFILES_ROOT = Path('/home/agentops/.hermes/profiles')",
  "ALLOWED_CRON_PROFILES: tuple[str, ...]",
  "CRITICAL_JOB_NAMES: frozenset[str]",
  "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'jobs')",
  "SAFE_JOB_ENTRY_KEYS = ('last_run_at', 'last_status', 'criticality')",
  "registry_path = profiles_root / profile / 'cron' / 'jobs.json'",
  "os.replace(temp_path, output)",
  "os.chmod(output, 0o640)",
  "os.chmod(output.parent, 0o750)",
]

for (const snippet of requiredCronjobsStatusProducerSnippets) {
  mustInclude(cronjobsStatusProducer, snippet, 'cronjobs status manifest producer')
}

const requiredVaultSyncStatusProducerSnippets = [
  "DEFAULT_SYNC_SCRIPT = Path('/srv/crew-core/scripts/vault-sync.sh')",
  "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/vault-sync-status.json')",
  "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'last_success_at')",
  "DEGRADED_MANIFEST_KEYS = ('status', 'result', 'updated_at')",
  'stdout=subprocess.DEVNULL',
  'stderr=subprocess.DEVNULL',
  "os.replace(temp_path, output)",
  "os.chmod(output, 0o640)",
  "os.chmod(output.parent, 0o750)",
  '_fsync_directory(output.parent)',
]

for (const snippet of requiredVaultSyncStatusProducerSnippets) {
  mustInclude(vaultSyncStatusProducer, snippet, 'vault-sync status manifest producer')
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
  'Phase 15.4a also allows the fixed `project-health` repo-local manifest reader',
  'Phase 15.4b adds `scripts/write-project-health-status.py` as the reviewed producer',
  'writes only status/result, updated_at and boolean workspace/main/sync semantics',
  'Phase 15.4b produces that manifest with atomic writes and non-public file permissions',
  'Phase 15.3b reads a fixed local backup status manifest and exposes only timestamp/result/checksum/retention-derived summary fields',
  'Phase 15.4a reads a fixed Zoro-owned repo-local status manifest and exposes only timestamp/result plus boolean workspace/main/sync semantics',
  'Phase 15.5a also allows the fixed `gateway-status` manifest reader',
  'it consumes only `updated_at` and boolean/enum active state',
  'Phase 15.5b adds `scripts/write-gateway-status.py` as the reviewed producer',
  'only checks allowlisted `hermes-gateway-<slug>.service` active state',
  'mugiwara-gateway-status.timer',
  'scripts/install-gateway-status-user-timer.sh',
  'does not inspect journal output, unit file contents, PIDs, command lines, env values, logs, stdout/stderr or alternate output paths',
  'Phase 15.6a also allows the fixed `cronjobs-status` manifest reader',
  'it consumes only `updated_at`, manifest result and per-job safe status/freshness/criticality semantics',
  'does not expose job names, owner profiles, prompt bodies, commands, delivery targets, chat IDs, logs, stdout/stderr or raw outputs',
  'Phase 15.6b adds `scripts/write-cronjobs-status.py` as the reviewed producer',
  'allowlisted Hermes profile cron registries',
  'mugiwara-cronjobs-status.timer',
  'scripts/install-cronjobs-status-user-timer.sh',
  'does not serialize job names, owner profiles, prompt bodies, commands, delivery targets, chat IDs, logs, stdout/stderr, raw outputs, host paths, tokens or credentials',
  'GitHub issue/PR counts or last-verify aggregation',
  'Phase 18.1 adds `scripts/write-vault-sync-status.py`',
  'runs the fixed Franky-owned `/srv/crew-core/scripts/vault-sync.sh` operational source outside the backend and consumes only the exit code',
  'There is no unit/timer in Phase 18.1',
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

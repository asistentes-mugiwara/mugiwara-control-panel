#!/usr/bin/env node
/**
 * Static guardrail for the cronjobs status manifest runner installed by Phase 15.6b.
 *
 * It keeps the operational automation narrow: user-level systemd timer only,
 * fixed output path through npm run write:cronjobs-status, allowlisted Hermes
 * profile cron registries only, and no job name/prompt/command/target/log leakage.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  producer: join(repoRoot, 'scripts/write-cronjobs-status.py'),
  service: join(repoRoot, 'ops/systemd/user/mugiwara-cronjobs-status.service'),
  timer: join(repoRoot, 'ops/systemd/user/mugiwara-cronjobs-status.timer'),
  installer: join(repoRoot, 'scripts/install-cronjobs-status-user-timer.sh'),
  policyDoc: join(repoRoot, 'docs/healthcheck-source-policy.md'),
  readModelsDoc: join(repoRoot, 'docs/read-models.md'),
  apiModulesDoc: join(repoRoot, 'docs/api-modules.md'),
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

function stripSystemdComments(text) {
  return text
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n')
}

function stripShellCommentsAndHelp(text) {
  const lines = []
  let inHelp = false
  for (const line of text.split('\n')) {
    if (line.includes("<<'USAGE'")) {
      inHelp = true
      continue
    }
    if (inHelp) {
      if (line.trim() === 'USAGE') inHelp = false
      continue
    }
    if (!line.trimStart().startsWith('#')) lines.push(line)
  }
  return lines.join('\n')
}

const packageJsonText = read(paths.packageJson, 'package.json')
const producer = read(paths.producer, 'cronjobs status producer')
const service = read(paths.service, 'cronjobs status systemd service')
const timer = read(paths.timer, 'cronjobs status systemd timer')
const installer = read(paths.installer, 'cronjobs status timer installer')
const policyDoc = read(paths.policyDoc, 'Healthcheck source policy document')
const readModelsDoc = read(paths.readModelsDoc, 'read models document')
const apiModulesDoc = read(paths.apiModulesDoc, 'API modules document')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson && packageJson.scripts?.['verify:cronjobs-status-runner'] !== 'node scripts/check-cronjobs-status-runner.mjs') {
  failures.push('package.json must expose verify:cronjobs-status-runner')
}
if (packageJson && packageJson.scripts?.['write:cronjobs-status'] !== 'python3 scripts/write-cronjobs-status.py') {
  failures.push('package.json must expose write:cronjobs-status through python3')
}

const activeService = stripSystemdComments(service)
const activeInstaller = stripShellCommentsAndHelp(installer)

mustInclude(producer, "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/cronjobs-status.json')", 'cronjobs status producer')
mustInclude(producer, "DEFAULT_PROFILES_ROOT = Path('/home/agentops/.hermes/profiles')", 'cronjobs status producer')
mustInclude(producer, "ALLOWED_CRON_PROFILES: tuple[str, ...]", 'cronjobs status producer')
mustInclude(producer, "CRITICAL_JOB_NAMES: frozenset[str]", 'cronjobs status producer')
mustInclude(producer, "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'jobs')", 'cronjobs status producer')
mustInclude(producer, "SAFE_JOB_ENTRY_KEYS = ('last_run_at', 'last_status', 'criticality')", 'cronjobs status producer')
mustInclude(producer, "registry_path = profiles_root / profile / 'cron' / 'jobs.json'", 'cronjobs status producer')
mustInclude(producer, "os.replace(temp_path, output)", 'cronjobs status producer')
mustInclude(producer, "os.chmod(output, 0o640)", 'cronjobs status producer')
mustInclude(producer, "os.chmod(output.parent, 0o750)", 'cronjobs status producer')
mustNotInclude(producer, /subprocess|systemctl|journalctl|cronjob\s+list|prompt_body.*manifest|command.*manifest|stdout.*manifest|stderr.*manifest|raw_output.*manifest|chat_id.*manifest|deliver.*manifest/i, 'cronjobs status producer', 'runtime command execution or raw cron fields in manifest contract')

mustInclude(service, 'Type=oneshot', 'cronjobs status systemd service')
mustInclude(service, 'WorkingDirectory=/srv/crew-core/projects/mugiwara-control-panel', 'cronjobs status systemd service')
mustInclude(service, 'ExecStart=/usr/bin/env npm run write:cronjobs-status', 'cronjobs status systemd service')
mustInclude(service, '/srv/crew-core/runtime/healthcheck/cronjobs-status.json', 'cronjobs status systemd service')
mustInclude(service, 'NoNewPrivileges=yes', 'cronjobs status systemd service')
mustInclude(service, 'PrivateTmp=yes', 'cronjobs status systemd service')
mustInclude(service, 'ProtectSystem=full', 'cronjobs status systemd service')
mustNotInclude(activeService, /--output\b|--profiles-root\b/, 'cronjobs status systemd service', 'path override')
mustNotInclude(activeService, /cronjob\s+list|journalctl|systemctl|stdout|stderr|raw_output|prompt|command|chat_id|delivery target/i, 'cronjobs status systemd service', 'raw runtime leakage language')

mustInclude(timer, 'OnBootSec=2min', 'cronjobs status systemd timer')
mustInclude(timer, 'OnUnitActiveSec=5min', 'cronjobs status systemd timer')
mustInclude(timer, 'RandomizedDelaySec=30s', 'cronjobs status systemd timer')
mustInclude(timer, 'Persistent=true', 'cronjobs status systemd timer')
mustInclude(timer, 'Unit=mugiwara-cronjobs-status.service', 'cronjobs status systemd timer')
mustInclude(timer, 'WantedBy=timers.target', 'cronjobs status systemd timer')

mustInclude(installer, 'systemctl --user daemon-reload', 'cronjobs status timer installer')
mustInclude(installer, 'systemctl --user enable --now "$timer_name"', 'cronjobs status timer installer')
mustInclude(installer, 'allowlisted Hermes profile cron registries', 'cronjobs status timer installer')
mustNotInclude(activeInstaller, /--output\b|--profiles-root\b/, 'cronjobs status timer installer', 'path override outside help contract')
mustNotInclude(activeInstaller, /cronjob\s+list|journalctl|systemctl\s+--user\s+(show|cat|status|list-units|list-unit-files)/i, 'cronjobs status timer installer', 'runtime discovery/detail reads')

for (const [text, label] of [
  [policyDoc, 'Healthcheck source policy document'],
  [readModelsDoc, 'read models document'],
  [apiModulesDoc, 'API modules document'],
]) {
  mustInclude(text, 'mugiwara-cronjobs-status.timer', label)
  mustInclude(text, 'scripts/install-cronjobs-status-user-timer.sh', label)
  mustInclude(text, 'allowlisted Hermes profile cron registries', label)
  mustInclude(text, 'does not serialize job names, owner profiles, prompt bodies, commands, delivery targets, chat IDs, logs, stdout/stderr, raw outputs, host paths, tokens or credentials', label)
}

if (failures.length > 0) {
  console.error('Cronjobs status runner check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Cronjobs status runner check passed')

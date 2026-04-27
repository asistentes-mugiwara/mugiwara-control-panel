#!/usr/bin/env node
/**
 * Static guardrail for the vault-sync status manifest runner installed by Phase 18.2.
 *
 * It keeps the operational automation narrow: user-level systemd timer only,
 * fixed npm script, fixed vault-sync source/output defaults, no path overrides
 * in the unit/installer, and no raw vault/Git/log leakage in docs or runner.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  producer: join(repoRoot, 'scripts/write-vault-sync-status.py'),
  service: join(repoRoot, 'ops/systemd/user/mugiwara-vault-sync-status.service'),
  timer: join(repoRoot, 'ops/systemd/user/mugiwara-vault-sync-status.timer'),
  installer: join(repoRoot, 'scripts/install-vault-sync-status-user-timer.sh'),
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
const producer = read(paths.producer, 'vault-sync status producer')
const service = read(paths.service, 'vault-sync status systemd service')
const timer = read(paths.timer, 'vault-sync status systemd timer')
const installer = read(paths.installer, 'vault-sync status timer installer')
const policyDoc = read(paths.policyDoc, 'Healthcheck source policy document')
const readModelsDoc = read(paths.readModelsDoc, 'read models document')
const apiModulesDoc = read(paths.apiModulesDoc, 'API modules document')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson && packageJson.scripts?.['verify:vault-sync-status-runner'] !== 'node scripts/check-vault-sync-status-runner.mjs') {
  failures.push('package.json must expose verify:vault-sync-status-runner')
}
if (packageJson && packageJson.scripts?.['write:vault-sync-status'] !== 'python3 scripts/write-vault-sync-status.py') {
  failures.push('package.json must expose write:vault-sync-status through python3')
}

const activeService = stripSystemdComments(service)
const activeInstaller = stripShellCommentsAndHelp(installer)

mustInclude(producer, "DEFAULT_SYNC_SCRIPT = Path('/srv/crew-core/scripts/vault-sync.sh')", 'vault-sync status producer')
mustInclude(producer, "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/vault-sync-status.json')", 'vault-sync status producer')
mustInclude(producer, "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'last_success_at')", 'vault-sync status producer')
mustInclude(producer, "DEGRADED_MANIFEST_KEYS = ('status', 'result', 'updated_at')", 'vault-sync status producer')
mustInclude(producer, 'stdout=subprocess.DEVNULL', 'vault-sync status producer')
mustInclude(producer, 'stderr=subprocess.DEVNULL', 'vault-sync status producer')
mustInclude(producer, 'timeout_seconds: int = 600', 'vault-sync status producer')
mustInclude(producer, 'timeout=timeout_seconds', 'vault-sync status producer')
mustInclude(producer, 'os.replace(temp_path, output)', 'vault-sync status producer')
mustInclude(producer, 'os.chmod(output, 0o640)', 'vault-sync status producer')
mustInclude(producer, 'os.chmod(output.parent, 0o750)', 'vault-sync status producer')
mustInclude(producer, '_fsync_directory(output.parent)', 'vault-sync status producer')
mustNotInclude(producer, /stdout.*manifest|stderr.*manifest|raw_output|traceback|token|credential|remote_url/i, 'vault-sync status producer', 'raw/sensitive manifest serialization')

mustInclude(service, 'Type=oneshot', 'vault-sync status systemd service')
mustInclude(service, 'WorkingDirectory=/srv/crew-core/projects/mugiwara-control-panel', 'vault-sync status systemd service')
mustInclude(service, 'ExecStart=/usr/bin/env npm run write:vault-sync-status', 'vault-sync status systemd service')
mustInclude(service, 'TimeoutStartSec=620s', 'vault-sync status systemd service')
mustInclude(service, '/srv/crew-core/runtime/healthcheck/vault-sync-status.json', 'vault-sync status systemd service')
mustInclude(service, '/srv/crew-core/scripts/vault-sync.sh', 'vault-sync status systemd service')
mustInclude(service, 'NoNewPrivileges=yes', 'vault-sync status systemd service')
mustInclude(service, 'PrivateTmp=yes', 'vault-sync status systemd service')
mustInclude(service, 'ProtectSystem=full', 'vault-sync status systemd service')
mustInclude(service, 'ProtectHome=read-only', 'vault-sync status systemd service')
mustNotInclude(activeService, /--output\b|--sync-script\b|--timeout-seconds\b/, 'vault-sync status systemd service', 'producer CLI overrides')
mustNotInclude(activeService, /journalctl|systemctl\s+--user\s+(show|cat|status|list-units|list-unit-files)|stdout|stderr|raw_output|traceback|branch|remote|token|credential|\.env/i, 'vault-sync status systemd service', 'raw runtime or sensitive leakage language')

mustInclude(timer, 'OnBootSec=3min', 'vault-sync status systemd timer')
mustInclude(timer, 'OnUnitActiveSec=20min', 'vault-sync status systemd timer')
mustInclude(timer, 'RandomizedDelaySec=120s', 'vault-sync status systemd timer')
mustInclude(timer, 'Persistent=true', 'vault-sync status systemd timer')
mustInclude(timer, 'Unit=mugiwara-vault-sync-status.service', 'vault-sync status systemd timer')
mustInclude(timer, 'WantedBy=timers.target', 'vault-sync status systemd timer')

mustInclude(installer, 'systemctl --user daemon-reload', 'vault-sync status timer installer')
mustInclude(installer, 'systemctl --user enable --now "$timer_name"', 'vault-sync status timer installer')
mustInclude(installer, 'mugiwara-vault-sync-status.timer', 'vault-sync status timer installer')
mustInclude(installer, 'npm run write:vault-sync-status', 'vault-sync status timer installer')
mustNotInclude(activeInstaller, /--output\b|--sync-script\b|--timeout-seconds\b/, 'vault-sync status timer installer', 'producer CLI overrides outside help contract')
mustNotInclude(activeInstaller, /journalctl|systemctl\s+--user\s+(show|cat|status|list-units|list-unit-files)/i, 'vault-sync status timer installer', 'systemd detail reads')

for (const [text, label] of [
  [policyDoc, 'Healthcheck source policy document'],
  [readModelsDoc, 'read models document'],
  [apiModulesDoc, 'API modules document'],
]) {
  mustInclude(text, 'mugiwara-vault-sync-status.timer', label)
  mustInclude(text, 'scripts/install-vault-sync-status-user-timer.sh', label)
  mustInclude(text, 'runs `npm run write:vault-sync-status`', label)
  mustInclude(text, 'does not pass `--output`, `--sync-script` or `--timeout-seconds`', label)
  mustInclude(text, 'TimeoutStartSec=620s', label)
  mustInclude(text, 'stdout/stderr', label)
}

if (failures.length > 0) {
  console.error('Vault-sync status runner check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Vault-sync status runner check passed')

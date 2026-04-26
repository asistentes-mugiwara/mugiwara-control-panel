#!/usr/bin/env node
/**
 * Static guardrail for the gateway status manifest runner installed by Phase 15.5b.
 *
 * It keeps the operational automation narrow: user-level systemd timer only,
 * fixed output path through npm run write:gateway-status, allowlisted gateway
 * unit active checks only, and no journal/unit/PID/log/env leakage.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  producer: join(repoRoot, 'scripts/write-gateway-status.py'),
  service: join(repoRoot, 'ops/systemd/user/mugiwara-gateway-status.service'),
  timer: join(repoRoot, 'ops/systemd/user/mugiwara-gateway-status.timer'),
  installer: join(repoRoot, 'scripts/install-gateway-status-user-timer.sh'),
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
const producer = read(paths.producer, 'gateway status producer')
const service = read(paths.service, 'gateway status systemd service')
const timer = read(paths.timer, 'gateway status systemd timer')
const installer = read(paths.installer, 'gateway status timer installer')
const policyDoc = read(paths.policyDoc, 'Healthcheck source policy document')
const readModelsDoc = read(paths.readModelsDoc, 'read models document')
const apiModulesDoc = read(paths.apiModulesDoc, 'API modules document')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson && packageJson.scripts?.['verify:gateway-status-runner'] !== 'node scripts/check-gateway-status-runner.mjs') {
  failures.push('package.json must expose verify:gateway-status-runner')
}
if (packageJson && packageJson.scripts?.['write:gateway-status'] !== 'python3 scripts/write-gateway-status.py') {
  failures.push('package.json must expose write:gateway-status through python3')
}

const activeService = stripSystemdComments(service)
const activeInstaller = stripShellCommentsAndHelp(installer)

mustInclude(producer, "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/gateway-status.json')", 'gateway status producer')
mustInclude(producer, "['systemctl', '--user', 'is-active', unit_name]", 'gateway status producer')
mustInclude(producer, "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'gateways')", 'gateway status producer')
mustInclude(producer, "SAFE_GATEWAY_ENTRY_KEYS = ('active',)", 'gateway status producer')
mustInclude(producer, 'def _fsync_parent_directory(directory: Path)', 'gateway status producer')
mustInclude(producer, 'os.open(directory, os.O_RDONLY | os.O_DIRECTORY)', 'gateway status producer')
mustInclude(producer, 'os.fsync(dir_fd)', 'gateway status producer')
mustNotInclude(producer, /journalctl|systemctl\s+--user\s+(show|cat|status|list-units|list-unit-files)|get-environment|MainPID|ExecStart|Environment=/i, 'gateway status producer', 'systemd discovery/journal/unit detail')
mustNotInclude(producer, /stdout.*manifest|stderr.*manifest|raw_output|unit_content|command_line|pid\b/i, 'gateway status producer', 'raw operational output in manifest contract')

mustInclude(service, 'Type=oneshot', 'gateway status systemd service')
mustInclude(service, 'WorkingDirectory=/srv/crew-core/projects/mugiwara-control-panel', 'gateway status systemd service')
mustInclude(service, 'ExecStart=/usr/bin/env npm run write:gateway-status', 'gateway status systemd service')
mustInclude(service, '/srv/crew-core/runtime/healthcheck/gateway-status.json', 'gateway status systemd service')
mustInclude(service, 'TimeoutStartSec=30s', 'gateway status systemd service')
mustInclude(service, 'NoNewPrivileges=yes', 'gateway status systemd service')
mustInclude(service, 'PrivateTmp=yes', 'gateway status systemd service')
mustInclude(service, 'ProtectSystem=full', 'gateway status systemd service')
mustNotInclude(activeService, /--output\b/, 'gateway status systemd service', '--output override')
mustNotInclude(activeService, /journalctl|systemctl\s+--user\s+(show|cat|status|list-units|list-unit-files)|MainPID|Environment=/i, 'gateway status systemd service', 'systemd detail reads')
mustNotInclude(activeService, /stdout|stderr|raw_output|unit_content|journal|pid|command line|env values/i, 'gateway status systemd service', 'raw runtime leakage language')

mustInclude(timer, 'OnBootSec=1min', 'gateway status systemd timer')
mustInclude(timer, 'OnUnitActiveSec=2min', 'gateway status systemd timer')
mustInclude(timer, 'RandomizedDelaySec=15s', 'gateway status systemd timer')
mustInclude(timer, 'Persistent=true', 'gateway status systemd timer')
mustInclude(timer, 'Unit=mugiwara-gateway-status.service', 'gateway status systemd timer')
mustInclude(timer, 'WantedBy=timers.target', 'gateway status systemd timer')

mustInclude(installer, 'systemctl --user daemon-reload', 'gateway status timer installer')
mustInclude(installer, 'systemctl --user enable --now "$timer_name"', 'gateway status timer installer')
mustInclude(installer, 'allowlisted hermes-gateway-<slug>.service active state', 'gateway status timer installer')
mustNotInclude(activeInstaller, /--output\b/, 'gateway status timer installer', '--output override outside help contract')
mustNotInclude(activeInstaller, /journalctl|systemctl\s+--user\s+(show|cat|status|list-units|list-unit-files)/i, 'gateway status timer installer', 'systemd detail reads')

for (const [text, label] of [
  [policyDoc, 'Healthcheck source policy document'],
  [readModelsDoc, 'read models document'],
  [apiModulesDoc, 'API modules document'],
]) {
  mustInclude(text, 'mugiwara-gateway-status.timer', label)
  mustInclude(text, 'scripts/install-gateway-status-user-timer.sh', label)
  mustInclude(text, 'only checks allowlisted `hermes-gateway-<slug>.service` active state', label)
  mustInclude(text, 'TimeoutStartSec=30s', label)
  mustInclude(text, '--output', label)
  mustInclude(text, 'stdout/stderr', label)
}

if (failures.length > 0) {
  console.error('Gateway status runner check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Gateway status runner check passed')

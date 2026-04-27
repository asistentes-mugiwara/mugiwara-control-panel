#!/usr/bin/env node
/**
 * Static guardrail for the backup-health status manifest runner installed by Phase 18.4.
 *
 * It keeps the automation narrow: user-level systemd timer only, fixed npm
 * script, fixed backup-health producer defaults, no path overrides in the
 * installed unit/installer, no backup execution, and no raw backup/log leakage.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  producer: join(repoRoot, 'scripts/write-backup-health-status.py'),
  service: join(repoRoot, 'ops/systemd/user/mugiwara-backup-health-status.service'),
  timer: join(repoRoot, 'ops/systemd/user/mugiwara-backup-health-status.timer'),
  installer: join(repoRoot, 'scripts/install-backup-health-status-user-timer.sh'),
  policyDoc: join(repoRoot, 'docs/healthcheck-source-policy.md'),
  readModelsDoc: join(repoRoot, 'docs/read-models.md'),
  apiModulesDoc: join(repoRoot, 'docs/api-modules.md'),
  phase18Planning: join(repoRoot, 'openspec/phase-18-0-healthcheck-producers-planning.md'),
  phase18Roadmap: join(repoRoot, 'openspec/phase-18-healthcheck-producers-roadmap.md'),
  phase18_3Spec: join(repoRoot, 'openspec/phase-18-3-backup-health-status-producer.md'),
  phase18_4Spec: join(repoRoot, 'openspec/phase-18-4-backup-health-status-runner.md'),
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
const producer = read(paths.producer, 'backup-health status producer')
const service = read(paths.service, 'backup-health status systemd service')
const timer = read(paths.timer, 'backup-health status systemd timer')
const installer = read(paths.installer, 'backup-health status timer installer')
const policyDoc = read(paths.policyDoc, 'Healthcheck source policy document')
const readModelsDoc = read(paths.readModelsDoc, 'read models document')
const apiModulesDoc = read(paths.apiModulesDoc, 'API modules document')
const phase18Planning = read(paths.phase18Planning, 'Phase 18.0 planning OpenSpec')
const phase18Roadmap = read(paths.phase18Roadmap, 'Phase 18 roadmap')
const phase18_3Spec = read(paths.phase18_3Spec, 'Phase 18.3 OpenSpec')
const phase18_4Spec = read(paths.phase18_4Spec, 'Phase 18.4 OpenSpec')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson && packageJson.scripts?.['verify:backup-health-status-runner'] !== 'node scripts/check-backup-health-status-runner.mjs') {
  failures.push('package.json must expose verify:backup-health-status-runner')
}
if (packageJson && packageJson.scripts?.['write:backup-health-status'] !== 'python3 scripts/write-backup-health-status.py') {
  failures.push('package.json must expose write:backup-health-status through python3')
}

const activeService = stripSystemdComments(service)
const activeInstaller = stripShellCommentsAndHelp(installer)

mustInclude(producer, "DEFAULT_BACKUPS_DIR = Path('/srv/crew-core/backups')", 'backup-health status producer')
mustInclude(producer, "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/backup-health-status.json')", 'backup-health status producer')
mustInclude(producer, "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'last_success_at', 'checksum_present', 'retention_count')", 'backup-health status producer')
mustInclude(producer, 'EXPECTED_RETENTION_COUNT = 4', 'backup-health status producer')
mustInclude(producer, "['sha256sum', '-c', str(checksum_path)]", 'backup-health status producer')
mustInclude(producer, 'stdout=subprocess.DEVNULL', 'backup-health status producer')
mustInclude(producer, 'stderr=subprocess.DEVNULL', 'backup-health status producer')
mustInclude(producer, 'os.replace(temp_path, output)', 'backup-health status producer')
mustInclude(producer, 'os.chmod(output, 0o640)', 'backup-health status producer')
mustInclude(producer, 'os.chmod(output.parent, 0o750)', 'backup-health status producer')
mustInclude(producer, '_fsync_directory(output.parent)', 'backup-health status producer')
mustNotInclude(producer, /system-backup\.sh|BACKUP_DRY_RUN|tar\s|zstd|drive-backup-upload|rclone/i, 'backup-health status producer', 'backup execution or Drive upload execution')

mustInclude(service, 'Type=oneshot', 'backup-health status systemd service')
mustInclude(service, 'WorkingDirectory=/srv/crew-core/projects/mugiwara-control-panel', 'backup-health status systemd service')
mustInclude(service, 'ExecStart=/usr/bin/env npm run write:backup-health-status', 'backup-health status systemd service')
mustInclude(service, 'TimeoutStartSec=120s', 'backup-health status systemd service')
mustInclude(service, '/srv/crew-core/runtime/healthcheck/backup-health-status.json', 'backup-health status systemd service')
mustInclude(service, 'NoNewPrivileges=yes', 'backup-health status systemd service')
mustInclude(service, 'PrivateTmp=yes', 'backup-health status systemd service')
mustInclude(service, 'ProtectSystem=full', 'backup-health status systemd service')
mustInclude(service, 'ProtectHome=read-only', 'backup-health status systemd service')
mustNotInclude(activeService, /--output\b|--backups-dir\b/, 'backup-health status systemd service', 'producer CLI overrides')
mustNotInclude(activeService, /system-backup\.sh|\btar\b|\bzstd\b|drive[-_ ]?upload|rclone|journalctl|stdout|stderr|raw_output|traceback|archive|checksum\s*[=:]|hash|drive\s+target|token|credential|\.env/i, 'backup-health status systemd service', 'backup execution or raw/sensitive leakage language')

mustInclude(timer, 'OnBootSec=10min', 'backup-health status systemd timer')
mustInclude(timer, 'OnUnitActiveSec=8h', 'backup-health status systemd timer')
mustInclude(timer, 'RandomizedDelaySec=10min', 'backup-health status systemd timer')
mustInclude(timer, 'Persistent=true', 'backup-health status systemd timer')
mustInclude(timer, 'Unit=mugiwara-backup-health-status.service', 'backup-health status systemd timer')
mustInclude(timer, 'WantedBy=timers.target', 'backup-health status systemd timer')

mustInclude(installer, 'systemctl --user daemon-reload', 'backup-health status timer installer')
mustInclude(installer, 'systemctl --user enable --now "$timer_name"', 'backup-health status timer installer')
mustInclude(installer, 'mugiwara-backup-health-status.timer', 'backup-health status timer installer')
mustInclude(installer, 'npm run write:backup-health-status', 'backup-health status timer installer')
mustNotInclude(activeInstaller, /--output\b|--backups-dir\b/, 'backup-health status timer installer', 'producer CLI overrides outside help contract')
mustNotInclude(activeInstaller, /system-backup\.sh|\btar\b|\bzstd\b|drive[-_ ]?upload|rclone|journalctl|systemctl\s+--user\s+(show|cat|status|list-units|list-unit-files)/i, 'backup-health status timer installer', 'backup execution or systemd detail reads')

for (const [text, label] of [
  [policyDoc, 'Healthcheck source policy document'],
  [readModelsDoc, 'read models document'],
  [apiModulesDoc, 'API modules document'],
]) {
  mustInclude(text, 'mugiwara-backup-health-status.timer', label)
  mustInclude(text, 'scripts/install-backup-health-status-user-timer.sh', label)
  mustInclude(text, 'runs `npm run write:backup-health-status`', label)
  mustInclude(text, 'does not pass `--output` or `--backups-dir`', label)
  mustInclude(text, 'TimeoutStartSec=120s', label)
  mustInclude(text, 'does not run backups', label)
}

mustInclude(phase18Planning, 'no unit/timer in Phase 18.3', 'Phase 18.0 planning OpenSpec')
mustInclude(phase18Roadmap, 'no unit/timer in Phase 18.3', 'Phase 18 roadmap')
mustInclude(phase18_3Spec, 'no unit/timer in Phase 18.3', 'Phase 18.3 OpenSpec')
mustInclude(phase18_4Spec, 'Phase 18.4 — Runner/timer `backup-health-status`', 'Phase 18.4 OpenSpec')
mustInclude(phase18_4Spec, 'OnUnitActiveSec=8h', 'Phase 18.4 OpenSpec')
mustInclude(phase18_4Spec, 'ExecStart=/usr/bin/env npm run write:backup-health-status', 'Phase 18.4 OpenSpec')

if (failures.length > 0) {
  console.error('Backup-health status runner check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Backup-health status runner check passed')

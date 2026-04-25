#!/usr/bin/env node
/**
 * Static guardrail for the project-health manifest runner installed by issue #43.
 *
 * It keeps the operational automation narrow: user-level systemd timer only,
 * fixed repo/output path through npm run write:project-health-status, no git fetch,
 * no arbitrary --output in the unit, and documented install semantics.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  service: join(repoRoot, 'ops/systemd/user/mugiwara-project-health-status.service'),
  timer: join(repoRoot, 'ops/systemd/user/mugiwara-project-health-status.timer'),
  installer: join(repoRoot, 'scripts/install-project-health-status-user-timer.sh'),
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
const service = read(paths.service, 'project-health systemd service')
const timer = read(paths.timer, 'project-health systemd timer')
const installer = read(paths.installer, 'project-health timer installer')
const policyDoc = read(paths.policyDoc, 'Healthcheck source policy document')
const readModelsDoc = read(paths.readModelsDoc, 'read models document')
const apiModulesDoc = read(paths.apiModulesDoc, 'API modules document')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson && packageJson.scripts?.['verify:project-health-runner'] !== 'node scripts/check-project-health-runner.mjs') {
  failures.push('package.json must expose verify:project-health-runner')
}

const activeService = stripSystemdComments(service)
const activeInstaller = stripShellCommentsAndHelp(installer)

mustInclude(service, 'Type=oneshot', 'project-health systemd service')
mustInclude(service, 'WorkingDirectory=/srv/crew-core/projects/mugiwara-control-panel', 'project-health systemd service')
mustInclude(service, 'ExecStart=/usr/bin/env npm run write:project-health-status', 'project-health systemd service')
mustInclude(service, '/srv/crew-core/runtime/healthcheck/project-health-status.json', 'project-health systemd service')
mustInclude(service, 'NoNewPrivileges=yes', 'project-health systemd service')
mustInclude(service, 'PrivateTmp=yes', 'project-health systemd service')
mustInclude(service, 'ProtectSystem=full', 'project-health systemd service')
mustNotInclude(activeService, /git\s+fetch|\bgit\b.*\bfetch\b/i, 'project-health systemd service', 'git fetch')
mustNotInclude(activeService, /--output\b/, 'project-health systemd service', '--output override')
mustNotInclude(activeService, /--repo\b/, 'project-health systemd service', '--repo override')
mustNotInclude(activeService, /stdout|stderr|raw_output|diff|untracked|branch name|remote URL/i, 'project-health systemd service', 'raw Git/log leakage language')

mustInclude(timer, 'OnBootSec=2min', 'project-health systemd timer')
mustInclude(timer, 'OnUnitActiveSec=15min', 'project-health systemd timer')
mustInclude(timer, 'RandomizedDelaySec=60s', 'project-health systemd timer')
mustInclude(timer, 'Persistent=true', 'project-health systemd timer')
mustInclude(timer, 'Unit=mugiwara-project-health-status.service', 'project-health systemd timer')
mustInclude(timer, 'WantedBy=timers.target', 'project-health systemd timer')

mustInclude(installer, 'systemctl --user daemon-reload', 'project-health timer installer')
mustInclude(installer, 'systemctl --user enable --now "$timer_name"', 'project-health timer installer')
mustInclude(installer, 'remote_synced compares HEAD to the local upstream ref', 'project-health timer installer')
mustNotInclude(activeInstaller, /git\s+fetch|\bgit\b.*\bfetch\b/i, 'project-health timer installer', 'git fetch')
mustNotInclude(activeInstaller, /--output\b/, 'project-health timer installer', '--output override outside help contract')

for (const [text, label] of [
  [policyDoc, 'Healthcheck source policy document'],
  [readModelsDoc, 'read models document'],
  [apiModulesDoc, 'API modules document'],
]) {
  mustInclude(text, 'mugiwara-project-health-status.timer', label)
  mustInclude(text, 'scripts/install-project-health-status-user-timer.sh', label)
  mustInclude(text, 'does not run `git fetch`', label)
  mustInclude(text, '`remote_synced` compares `HEAD` with the local upstream ref', label)
}

if (failures.length > 0) {
  console.error('Project-health runner check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Project-health runner check passed')

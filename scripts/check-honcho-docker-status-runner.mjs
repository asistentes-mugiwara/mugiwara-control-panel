#!/usr/bin/env node
/** Static guardrail for Honcho/Docker status user timer runner. */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const servicePath = join(repoRoot, 'ops/systemd/user/mugiwara-honcho-docker-status.service')
const timerPath = join(repoRoot, 'ops/systemd/user/mugiwara-honcho-docker-status.timer')
const installerPath = join(repoRoot, 'scripts/install-honcho-docker-status-user-timer.sh')
const packagePath = join(repoRoot, 'package.json')
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
function mustNotInclude(text, snippet, label) {
  if (text.includes(snippet)) failures.push(`${label} must not include: ${snippet}`)
}

const packageJson = JSON.parse(read(packagePath, 'package.json') || '{}')
const service = read(servicePath, 'honcho/docker status service')
const timer = read(timerPath, 'honcho/docker status timer')
const installer = read(installerPath, 'honcho/docker status installer')

if (packageJson.scripts?.['verify:honcho-docker-status-runner'] !== 'node scripts/check-honcho-docker-status-runner.mjs') {
  failures.push('package.json must expose verify:honcho-docker-status-runner')
}

for (const snippet of [
  'ExecStart=/usr/bin/env npm run write:docker-runtime-status',
  'ExecStart=/usr/bin/env npm run write:honcho-status',
  'TimeoutStartSec=60s',
  'NoNewPrivileges=yes',
  'ProtectSystem=full',
]) mustInclude(service, snippet, 'honcho/docker status service')

for (const snippet of [
  'mugiwara-honcho-docker-status.service',
  'OnUnitActiveSec=2min',
  'RandomizedDelaySec=20s',
  'Persistent=true',
]) mustInclude(timer, snippet, 'honcho/docker status timer')

for (const snippet of [
  'mugiwara-honcho-docker-status.service',
  'mugiwara-honcho-docker-status.timer',
  'systemctl --user enable --now "$timer_name"',
  'does not pass --output, --docker-runtime-manifest or other alternate paths',
]) mustInclude(installer, snippet, 'honcho/docker status installer')

for (const forbidden of ['--output', '--docker-runtime-manifest', 'docker inspect', 'docker logs', '.env', 'DB_CONNECTION_URI', 'POSTGRES_PASSWORD']) {
  mustNotInclude(service, forbidden, 'honcho/docker status service')
}

if (failures.length > 0) {
  console.error('Honcho/Docker status runner check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Honcho/Docker status runner check passed')

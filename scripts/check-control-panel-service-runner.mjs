#!/usr/bin/env node
/** Static guardrail for Mugiwara Control Panel private API + Tailscale web services. */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  apiRunner: join(repoRoot, 'scripts/run-control-panel-api.sh'),
  webRunner: join(repoRoot, 'scripts/run-control-panel-web.sh'),
  installer: join(repoRoot, 'scripts/install-control-panel-user-services.sh'),
  apiService: join(repoRoot, 'ops/systemd/user/mugiwara-control-panel-api.service'),
  webService: join(repoRoot, 'ops/systemd/user/mugiwara-control-panel-web.service'),
  runtimeConfig: join(repoRoot, 'docs/runtime-config.md'),
  openspec: join(repoRoot, 'openspec/control-panel-tailscale-service.md'),
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
function stripComments(text) {
  return text.split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n')
}
function stripHelp(text) {
  const lines = []
  let inHelp = false
  for (const line of text.split('\n')) {
    if (line.includes("<<'USAGE'")) { inHelp = true; continue }
    if (inHelp) { if (line.trim() === 'USAGE') inHelp = false; continue }
    if (!line.trimStart().startsWith('#')) lines.push(line)
  }
  return lines.join('\n')
}

const packageJsonText = read(paths.packageJson, 'package.json')
const apiRunner = read(paths.apiRunner, 'API runner')
const webRunner = read(paths.webRunner, 'web runner')
const installer = read(paths.installer, 'installer')
const apiService = read(paths.apiService, 'API service')
const webService = read(paths.webService, 'web service')
const runtimeConfig = read(paths.runtimeConfig, 'runtime config docs')
const openspec = read(paths.openspec, 'OpenSpec')

let packageJson
try { packageJson = JSON.parse(packageJsonText) } catch { failures.push('package.json must be valid JSON') }
if (packageJson?.scripts?.['verify:control-panel-service-runner'] !== 'node scripts/check-control-panel-service-runner.mjs') {
  failures.push('package.json must expose verify:control-panel-service-runner')
}

mustInclude(apiRunner, 'api_host="${MUGIWARA_CONTROL_PANEL_API_HOST:-127.0.0.1}"', 'API runner')
mustInclude(apiRunner, 'if [[ "$api_host" != "127.0.0.1" ]]', 'API runner')
mustInclude(apiRunner, 'python_bin="${MUGIWARA_CONTROL_PANEL_PYTHON:-/home/agentops/.hermes/hermes-agent/venv/bin/python3}"', 'API runner')
mustInclude(apiRunner, '"$python_bin" -m uvicorn apps.api.src.main:app --host "$api_host" --port "$api_port"', 'API runner')
mustNotInclude(stripHelp(apiRunner), /0\.0\.0\.0|tailscale|NEXT_PUBLIC|--reload/, 'API runner', 'public bind, tailscale dependency, browser env or reload mode')

mustInclude(webRunner, 'api_url="${MUGIWARA_CONTROL_PANEL_API_URL:-http://127.0.0.1:8011}"', 'web runner')
mustInclude(webRunner, 'tailscale ip -4', 'web runner')
mustInclude(webRunner, 'Refusing wildcard bind', 'web runner')
mustInclude(webRunner, 'apps/web/.next/BUILD_ID', 'web runner')
mustInclude(webRunner, 'npm --prefix apps/web run start -- --hostname "$web_host" --port "$web_port"', 'web runner')
mustNotInclude(stripHelp(webRunner), /--hostname\s+0\.0\.0\.0|NEXT_PUBLIC|tailscale\s+(funnel|serve)|--reload/i, 'web runner', 'wildcard bind, browser env, Tailscale Funnel/Serve or dev reload')

mustInclude(apiService, 'ExecStart=/usr/bin/env bash scripts/run-control-panel-api.sh', 'API service')
mustInclude(apiService, 'Environment=MUGIWARA_CONTROL_PANEL_API_HOST=127.0.0.1', 'API service')
mustInclude(apiService, 'Environment=MUGIWARA_CONTROL_PANEL_API_PORT=8011', 'API service')
mustInclude(apiService, 'Restart=on-failure', 'API service')
mustInclude(apiService, 'NoNewPrivileges=yes', 'API service')
mustInclude(apiService, 'WantedBy=default.target', 'API service')
mustNotInclude(stripComments(apiService), /User=|Group=|0\.0\.0\.0|NEXT_PUBLIC|funnel|serve/i, 'API service', 'system user/group, public bind or public exposure')

mustInclude(webService, 'Wants=mugiwara-control-panel-api.service', 'web service')
mustInclude(webService, 'After=mugiwara-control-panel-api.service', 'web service')
mustInclude(webService, 'ExecStart=/usr/bin/env bash scripts/run-control-panel-web.sh', 'web service')
mustInclude(webService, 'Environment=MUGIWARA_CONTROL_PANEL_API_URL=http://127.0.0.1:8011', 'web service')
mustInclude(webService, 'Environment=MUGIWARA_CONTROL_PANEL_WEB_PORT=3017', 'web service')
mustInclude(webService, 'Restart=on-failure', 'web service')
mustInclude(webService, 'WantedBy=default.target', 'web service')
mustNotInclude(stripComments(webService), /User=|Group=|0\.0\.0\.0|NEXT_PUBLIC|funnel|serve/i, 'web service', 'system user/group, wildcard bind or public exposure')

mustInclude(installer, 'npm --prefix apps/web run build', 'installer')
mustInclude(installer, 'tailscale ip -4', 'installer')
mustInclude(installer, 'systemctl --user enable --now "$api_service"', 'installer')
mustInclude(installer, 'systemctl --user enable --now "$web_service"', 'installer')
mustNotInclude(stripHelp(installer), /0\.0\.0\.0|funnel|serve|NEXT_PUBLIC|--host\s+0/i, 'installer', 'public exposure or browser env')

for (const [text, label] of [[runtimeConfig, 'runtime config docs'], [openspec, 'OpenSpec']]) {
  mustInclude(text, 'mugiwara-control-panel-api.service', label)
  mustInclude(text, 'mugiwara-control-panel-web.service', label)
  mustInclude(text, '127.0.0.1:8011', label)
  mustInclude(text, '100.65.118.27:3017', label)
  mustInclude(text, 'internet-public', label)
}

if (failures.length > 0) {
  console.error('Control Panel service runner check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Control Panel service runner check passed')

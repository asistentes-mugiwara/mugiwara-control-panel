#!/usr/bin/env node
/** Static guardrail for safe Honcho Healthcheck producer. */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const producerPath = join(repoRoot, 'scripts/write-honcho-status.py')
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

const packageJson = JSON.parse(read(packagePath, 'package.json') || '{}')
const producer = read(producerPath, 'honcho producer')

if (packageJson.scripts?.['write:honcho-status'] !== 'python3 scripts/write-honcho-status.py') {
  failures.push('package.json must expose write:honcho-status with python3')
}
if (packageJson.scripts?.['verify:honcho-status-producer'] !== 'node scripts/check-honcho-status-producer.mjs') {
  failures.push('package.json must expose verify:honcho-status-producer')
}

for (const snippet of [
  "DEFAULT_DOCKER_RUNTIME_MANIFEST = Path('/srv/crew-core/runtime/healthcheck/docker-runtime-status.json')",
  "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/honcho-status.json')",
  "HONCHO_HEALTH_URL = 'http://127.0.0.1:8000/health'",
  "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'api', 'db', 'redis')",
  "SAFE_SERVICE_ENTRY_KEYS = ('ok',)",
  'docker runtime manifest could not be read safely',
  'urlopen(HONCHO_HEALTH_URL, timeout=5)',
  'os.replace(temp_path, output)',
  'os.chmod(output, 0o640)',
  'os.chmod(output.parent, 0o750)',
  '_fsync_directory(output.parent)',
]) {
  mustInclude(producer, snippet, 'honcho producer')
}

for (const forbidden of [
  'POSTGRES_PASSWORD',
  'DB_CONNECTION_URI',
  '.env',
  'docker compose',
  'docker inspect',
  'stdout',
  'stderr',
  'raw_output',
]) {
  if (producer.includes(forbidden)) failures.push(`honcho producer must not include ${forbidden}`)
}

if (failures.length > 0) {
  console.error('Honcho status producer check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Honcho status producer check passed')

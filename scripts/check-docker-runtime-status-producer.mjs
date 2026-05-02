#!/usr/bin/env node
/** Static guardrail for safe Docker runtime Healthcheck producer. */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const producerPath = join(repoRoot, 'scripts/write-docker-runtime-status.py')
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
const producer = read(producerPath, 'docker runtime producer')

if (packageJson.scripts?.['write:docker-runtime-status'] !== 'python3 scripts/write-docker-runtime-status.py') {
  failures.push('package.json must expose write:docker-runtime-status with python3')
}
if (packageJson.scripts?.['verify:docker-runtime-status-producer'] !== 'node scripts/check-docker-runtime-status-producer.mjs') {
  failures.push('package.json must expose verify:docker-runtime-status-producer')
}

for (const snippet of [
  "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/docker-runtime-status.json')",
  "CRITICAL_CONTAINER_NAMES: tuple[str, ...]",
  "'honcho-api'",
  "'honcho-database'",
  "'honcho-redis'",
  "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'containers')",
  "SAFE_CONTAINER_ENTRY_KEYS = ('running', 'health')",
  "['docker', 'ps', '-a', '--format', '{{json .}}']",
  'os.replace(temp_path, output)',
  'os.chmod(output, 0o640)',
  'os.chmod(output.parent, 0o750)',
  '_fsync_directory(output.parent)',
]) {
  mustInclude(producer, snippet, 'docker runtime producer')
}

for (const forbidden of [
  'docker inspect',
  'docker logs',
  'docker exec',
  'Mounts',
  'Env',
  'Labels',
  'NetworkSettings',
]) {
  if (producer.includes(forbidden)) failures.push(`docker runtime producer must not include ${forbidden}`)
}

if (failures.length > 0) {
  console.error('Docker runtime status producer check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Docker runtime status producer check passed')

#!/usr/bin/env node
/**
 * Static guardrail for the Phase 18.3 backup-health status producer.
 *
 * It keeps the producer narrow: fixed local backup artifact source, fixed
 * manifest output through npm run write:backup-health-status, atomic write
 * semantics, non-public permissions, fail-closed backup semantics, no backup
 * execution, no systemd runner/timer in this phase, and no serialization of
 * archive names, paths, hashes, sizes, Drive targets, stdout/stderr or logs.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  packageJson: join(repoRoot, 'package.json'),
  producer: join(repoRoot, 'scripts/write-backup-health-status.py'),
  policyDoc: join(repoRoot, 'docs/healthcheck-source-policy.md'),
  readModelsDoc: join(repoRoot, 'docs/read-models.md'),
  apiModulesDoc: join(repoRoot, 'docs/api-modules.md'),
  phaseSpec: join(repoRoot, 'openspec/phase-18-3-backup-health-status-producer.md'),
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

const packageJsonText = read(paths.packageJson, 'package.json')
const producer = read(paths.producer, 'backup-health status producer')
const policyDoc = read(paths.policyDoc, 'Healthcheck source policy document')
const readModelsDoc = read(paths.readModelsDoc, 'read models document')
const apiModulesDoc = read(paths.apiModulesDoc, 'API modules document')
const phaseSpec = read(paths.phaseSpec, 'Phase 18.3 OpenSpec')

let packageJson
try {
  packageJson = JSON.parse(packageJsonText)
} catch {
  failures.push('package.json must be valid JSON')
}

if (packageJson && packageJson.scripts?.['write:backup-health-status'] !== 'python3 scripts/write-backup-health-status.py') {
  failures.push('package.json must expose write:backup-health-status with python3')
}

if (packageJson && packageJson.scripts?.['verify:backup-health-status-producer'] !== 'node scripts/check-backup-health-status-producer.mjs') {
  failures.push('package.json must expose verify:backup-health-status-producer')
}

const requiredProducerSnippets = [
  "DEFAULT_BACKUPS_DIR = Path('/srv/crew-core/backups')",
  "DEFAULT_OUTPUT_PATH = Path('/srv/crew-core/runtime/healthcheck/backup-health-status.json')",
  "SAFE_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'last_success_at', 'checksum_present', 'retention_count')",
  "DEGRADED_MANIFEST_KEYS = ('status', 'result', 'updated_at', 'checksum_present', 'retention_count')",
  'EXPECTED_RETENTION_COUNT = 4',
  "['sha256sum', '-c', str(checksum_path)]",
  'stdout=subprocess.DEVNULL',
  'stderr=subprocess.DEVNULL',
  'stdin=subprocess.DEVNULL',
  "os.replace(temp_path, output)",
  "os.chmod(output, 0o640)",
  "os.chmod(output.parent, 0o750)",
  '_fsync_directory(output.parent)',
  "return 0 if manifest['status'] == 'success' else 1",
]

for (const snippet of requiredProducerSnippets) {
  mustInclude(producer, snippet, 'backup-health status producer')
}

mustNotInclude(producer, /system-backup\.sh|BACKUP_DRY_RUN|tar\s|zstd|drive-backup-upload|rclone/i, 'backup-health status producer', 'backup execution or Drive upload execution')
mustNotInclude(producer, /raw_output|traceback|\.env|token|credential|drive[-_ ]?target|archive_size|size_bytes|size_human/i, 'backup-health status producer', 'raw host detail serialization language')
mustNotInclude(producer, /shell\s*=\s*True|os\.system\s*\(|eval\s*\(|exec\s*\(/, 'backup-health status producer', 'generic shell/eval execution')

for (const [text, label] of [
  [policyDoc, 'Healthcheck source policy document'],
  [readModelsDoc, 'read models document'],
  [apiModulesDoc, 'API modules document'],
  [phaseSpec, 'Phase 18.3 OpenSpec'],
]) {
  mustInclude(text, 'scripts/write-backup-health-status.py', label)
  mustInclude(text, 'npm run write:backup-health-status', label)
  mustInclude(text, '/srv/crew-core/runtime/healthcheck/backup-health-status.json', label)
  mustInclude(text, 'no unit/timer in Phase 18.3', label)
  mustInclude(text, 'retention_count', label)
  mustInclude(text, 'checksum_present', label)
}

if (failures.length > 0) {
  console.error('Backup-health status producer check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Backup-health status producer check passed')

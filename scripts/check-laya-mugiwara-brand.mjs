#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const read = (path) => readFileSync(join(repoRoot, path), 'utf8')
const failures = []
const expectIncludes = (path, needle, message) => {
  if (!read(path).includes(needle)) failures.push(`${path}: ${message}`)
}
const expectNotIncludes = (path, needle, message) => {
  if (read(path).includes(needle)) failures.push(`${path}: ${message}`)
}

expectIncludes('.gitignore', 'apps/web/public/assets/brand/', 'private brand assets directory must stay ignored')
expectIncludes('apps/web/src/shared/brand/laya-mugiwara-brand.ts', "'/assets/brand/laya-mugiwara.svg'", 'favicon/app icon must point to local laya-mugiwara.svg')
expectIncludes('apps/web/src/shared/brand/laya-mugiwara-brand.ts', "'/assets/brand/laya-mugiwara.jpg'", 'PageHeader mark must point to local laya-mugiwara.jpg')
expectIncludes('apps/web/src/app/layout.tsx', 'LAYA_MUGIWARA_FAVICON_SRC', 'Next metadata icons must use laya-mugiwara favicon constant')
expectIncludes('apps/web/src/shared/ui/app-shell/PageHeader.tsx', 'LayaMugiwaraMark', 'PageHeader must render the Laya Mugiwara brand mark')
expectNotIncludes('apps/web/src/shared/ui/app-shell/PageHeader.tsx', 'MugiwaraCrest', 'PageHeader must not render per-agent Mugiwara crests')
expectNotIncludes('apps/web/src/shared/ui/app-shell/PageHeader.tsx', 'mugiwaraSlug', 'PageHeader must not expose per-agent crest prop for general page titles')

for (const route of [
  'apps/web/src/app/dashboard/page.tsx',
  'apps/web/src/app/healthcheck/page.tsx',
  'apps/web/src/app/mugiwaras/page.tsx',
  'apps/web/src/app/skills/page.tsx',
  'apps/web/src/app/usage/page.tsx',
  'apps/web/src/app/memory/MemoryClient.tsx',
  'apps/web/src/app/vault/VaultClient.tsx',
  'apps/web/src/app/git/page.tsx',
]) {
  expectNotIncludes(route, 'mugiwaraSlug=', 'general PageHeader calls must use the panel brand mark, not a per-agent crest')
}

expectIncludes('apps/web/src/app/mugiwaras/page.tsx', 'MugiwaraCrest', '/mugiwaras must keep per-agent crests in cards/contextual agent UI')
expectIncludes('docs/frontend-ui-spec.md', 'laya-mugiwara.jpg', 'frontend spec must document the PageHeader brand mark')
expectIncludes('docs/frontend-implementation-handoff.md', 'laya-mugiwara.svg', 'implementation handoff must document the private favicon dependency')

const trackedBrandAssets = execFileSync('git', ['ls-files', 'apps/web/public/assets/brand'], { cwd: repoRoot, encoding: 'utf8' }).trim()
if (trackedBrandAssets) {
  failures.push(`private brand assets must not be tracked by Git: ${trackedBrandAssets}`)
}

for (const localAsset of ['apps/web/public/assets/brand/laya-mugiwara.svg', 'apps/web/public/assets/brand/laya-mugiwara.jpg']) {
  if (!existsSync(join(repoRoot, localAsset))) {
    console.warn(`[laya-mugiwara-brand] aviso: falta asset privado local ${localAsset}; el repo público documenta esta dependencia pero no la versiona.`)
  }
}

if (failures.length > 0) {
  console.error('Laya Mugiwara brand guardrail failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Laya Mugiwara brand guardrail passed')

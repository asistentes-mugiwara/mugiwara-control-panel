#!/usr/bin/env node
/** Static safety check for Phase 12.4 Vault server-only integration. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const vaultHttpPath = join(repoRoot, 'apps/web/src/modules/vault/api/vault-http.ts')
const vaultPagePath = join(repoRoot, 'apps/web/src/app/vault/page.tsx')
const vaultClientPath = join(repoRoot, 'apps/web/src/app/vault/VaultClient.tsx')

const vaultHttp = readFileSync(vaultHttpPath, 'utf8')
const vaultPage = readFileSync(vaultPagePath, 'utf8')
const vaultClient = readFileSync(vaultClientPath, 'utf8')
const failures = []

if (!vaultHttp.includes("import 'server-only'")) {
  failures.push('vault-http.ts must be server-only guarded')
}
if (!vaultHttp.includes("VAULT_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'")) {
  failures.push('vault-http.ts must use MUGIWARA_CONTROL_PANEL_API_URL')
}
if (vaultHttp.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('vault-http.ts must not use public backend env')
}
if (!vaultHttp.includes("parsed.protocol !== 'http:'") || !vaultHttp.includes("parsed.protocol !== 'https:'")) {
  failures.push('vault-http.ts must reject non-http(s) API base URLs')
}
if (!vaultHttp.includes("cache: 'no-store'")) {
  failures.push('vault-http.ts must fetch with cache: no-store')
}
if (!vaultPage.includes("export const dynamic = 'force-dynamic'")) {
  failures.push('vault/page.tsx must force dynamic rendering')
}
if (vaultPage.includes("'use client'")) {
  failures.push('vault/page.tsx must remain a server page')
}
if (vaultClient.includes('process.env') || vaultClient.includes('MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('VaultClient must not read server env')
}

if (failures.length > 0) {
  console.error('Vault server-only integration check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Vault server-only integration check passed')

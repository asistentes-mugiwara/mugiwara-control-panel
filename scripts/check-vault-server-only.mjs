#!/usr/bin/env node
/** Static safety check for Vault explorer + Markdown reader server-only integration. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const vaultHttpPath = join(repoRoot, 'apps/web/src/modules/vault/api/vault-http.ts')
const vaultPagePath = join(repoRoot, 'apps/web/src/app/vault/page.tsx')
const vaultClientPath = join(repoRoot, 'apps/web/src/app/vault/VaultClient.tsx')
const vaultFixturePath = join(repoRoot, 'apps/web/src/modules/vault/view-models/vault-explorer.fixture.ts')

const vaultHttp = readFileSync(vaultHttpPath, 'utf8')
const vaultPage = readFileSync(vaultPagePath, 'utf8')
const vaultClient = readFileSync(vaultClientPath, 'utf8')
const vaultFixture = readFileSync(vaultFixturePath, 'utf8')
const globalCss = readFileSync(join(repoRoot, 'apps/web/src/app/globals.css'), 'utf8')
const failures = []

if (!vaultHttp.includes("import 'server-only'")) {
  failures.push('vault-http.ts must be server-only guarded')
}
if (!vaultHttp.includes("VAULT_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'")) {
  failures.push('vault-http.ts must use private MUGIWARA_CONTROL_PANEL_API_URL')
}
if (vaultHttp.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL') || vaultClient.includes('NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('Vault frontend must not use public backend env')
}
if (!vaultHttp.includes("/api/v1/vault/tree") || !vaultHttp.includes("/api/v1/vault/documents/")) {
  failures.push('vault-http.ts must consume tree and document reader endpoints')
}
if (!vaultHttp.includes('encodeURIComponent') || !vaultHttp.includes(".split('/')")) {
  failures.push('vault-http.ts must encode document path by segment')
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
if (!vaultPage.includes("fetchVaultTree()") || !vaultPage.includes('fetchVaultDocument(selectedPath)')) {
  failures.push('vault/page.tsx must load tree and selected Markdown document server-side')
}
if (!vaultPage.includes('isSafeSelectedPath') || !vaultPage.includes('tree.documents.some')) {
  failures.push('vault/page.tsx must select documents only from backend-owned tree documents')
}
if (vaultClient.includes('process.env') || vaultClient.includes('MUGIWARA_CONTROL_PANEL_API_URL')) {
  failures.push('VaultClient must not read server env or backend URL')
}
if (vaultClient.includes('dangerouslySetInnerHTML')) {
  failures.push('VaultClient must not render Markdown with dangerouslySetInnerHTML')
}
if (!vaultClient.includes('getSafeHref') || !vaultClient.includes("parsed.protocol === 'https:'") || !vaultClient.includes("parsed.protocol === 'http:'")) {
  failures.push('VaultClient must sanitize Markdown links')
}
if (!vaultClient.includes('parseConservativeMarkdown') || !vaultClient.includes('vault-markdown-table-wrap') || !vaultClient.includes('vault-markdown-frontmatter')) {
  failures.push('VaultClient must use conservative Markdown rendering for tables/frontmatter/code')
}
for (const retiredText of ['Canon curado', 'Índice allowlisted', 'Lectura editorial', 'Pieza canónica', 'TOC sin entradas', 'Metadatos no disponibles']) {
  if (vaultClient.includes(retiredText)) {
    failures.push(`VaultClient must not keep retired editorial UI text: ${retiredText}`)
  }
}
if (!vaultClient.includes('Vault · Solo lectura') || !vaultClient.includes('Explorador') || !vaultClient.includes('Documento seleccionado')) {
  failures.push('VaultClient must expose the new explorer + reader UI contract')
}
if (!vaultPage.includes('document.relative_path !== selectedPath')) {
  failures.push('vault/page.tsx must assert returned document path matches selectedPath')
}
if (!vaultClient.includes('clamp(8px') || !globalCss.includes('@media (max-width: 1100px)')) {
  failures.push('Vault responsive contract must cap deep indentation and stack earlier for tablet')
}
if (!globalCss.includes('.vault-reader-panel') || !globalCss.includes('order: 1') || !globalCss.includes('.vault-explorer-panel') || !globalCss.includes('order: 2') || !globalCss.includes('max-height: 30vh')) {
  failures.push('Vault mobile contract must prioritize the reader and keep explorer height bounded')
}
if (!globalCss.includes('min-width: min(520px, 100%)') || !globalCss.includes('.vault-markdown-table-wrap td')) {
  failures.push('Vault Markdown tables must keep overflow internal and avoid forcing mobile page width')
}
if (!vaultFixture.includes('---') || !vaultFixture.includes('| Superficie | Estado |') || !vaultFixture.includes('\\`\\`\\`text')) {
  failures.push('Vault fixture must exercise frontmatter, tables and fenced code')
}

if (failures.length > 0) {
  console.error('Vault server-only integration check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Vault server-only integration check passed')

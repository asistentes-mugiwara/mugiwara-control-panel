#!/usr/bin/env node
/** Regression check for Issue #99: Hermes activity partial status must not own global Usage state. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const pagePath = join(repoRoot, 'apps/web/src/app/usage/page.tsx')
const page = readFileSync(pagePath, 'utf8')
const failures = []

function expectIncludes(fragment, message) {
  if (!page.includes(fragment)) failures.push(message)
}

function expectNotIncludes(fragment, message) {
  if (page.includes(fragment)) failures.push(message)
}

expectIncludes('const usageCoreStatus = currentResponse.status', 'Usage page must compute a dedicated core status from Codex endpoints')
expectIncludes("? fiveHourWindowsResponse.status\n          : 'ready'", 'Usage core status must resolve to ready after current/calendar/five-hour-windows are ready')
expectNotIncludes(': hermesActivityResponse.status', 'Hermes activity status must not be the fallback/global Usage status')
expectIncludes('hermesActivityNotice: noticeFromHermesActivityStatus(hermesActivityResponse.status)', 'Hermes activity status must become a localized section notice')
expectIncludes('function noticeFromHermesActivityStatus(status: ResourceStatus): HermesActivityNotice | null', 'Usage page must model Hermes activity notice separately')
expectIncludes("title: 'Actividad Hermes no configurada'", 'Mixed ready core + Hermes not_configured must show localized Hermes copy')
expectIncludes('Usage Codex sigue conectado si el snapshot principal, el calendario y las ventanas 5h están listos.', 'Localized Hermes notice must explicitly preserve ready Codex/core state')
expectIncludes('Estado de actividad Hermes', 'Localized Hermes notice must render inside the Hermes activity section')
expectIncludes('Estado localizado de actividad Hermes', 'Localized Hermes notice must have scoped accessibility label')
expectIncludes('<UsageHermesActivityPanel activity={hermesActivity} notice={hermesActivityNotice}', 'Usage page must pass localized Hermes notice to the activity panel')

const globalNoticeBlock = page.slice(page.indexOf('function noticeFromResourceStatus'), page.indexOf('function noticeFromHermesActivityStatus'))
if (!globalNoticeBlock.includes("title: 'Usage sin fuente configurada'")) {
  failures.push('Global Usage not_configured notice must remain available for core/source failures')
}
if (globalNoticeBlock.includes('Actividad Hermes no configurada')) {
  failures.push('Global Usage notice must not contain localized Hermes activity copy')
}

for (const forbidden of ['state.db', 'MUGIWARA_HERMES_PROFILES_ROOT', 'tokens por sesión', 'tokens por conversación']) {
  if (page.includes(forbidden)) failures.push(`Usage UI must not render sensitive Hermes internals: ${forbidden}`)
}

if (failures.length > 0) {
  console.error('Usage partial Hermes status regression check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Usage partial Hermes status regression check passed')

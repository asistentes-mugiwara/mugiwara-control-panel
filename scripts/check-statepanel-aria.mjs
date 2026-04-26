import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const statePanelPath = join(root, 'apps/web/src/shared/ui/state/StatePanel.tsx')
const healthcheckPath = join(root, 'apps/web/src/app/healthcheck/page.tsx')

const statePanel = readFileSync(statePanelPath, 'utf8')
const healthcheck = readFileSync(healthcheckPath, 'utf8')

const failures = []

if (statePanel.includes('role="status"')) {
  failures.push('StatePanel must not hardcode role="status" for every panel.')
}

if (!statePanel.includes('ariaRole?: StatePanelAriaRole')) {
  failures.push('StatePanel must expose a typed ariaRole override for intentional live/alert/region semantics.')
}

if (!statePanel.includes("aria-live")) {
  failures.push('StatePanel must map live roles to explicit aria-live behavior.')
}

if (!healthcheck.includes('ariaRole={priorityNotice.status === \'incidencia\' ? \'alert\' : \'region\'}')) {
  failures.push('Healthcheck priority notice must opt into alert/region semantics explicitly.')
}

if (failures.length > 0) {
  console.error('StatePanel ARIA guardrail failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('StatePanel ARIA guardrail passed.')

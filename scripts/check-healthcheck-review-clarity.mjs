#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const checks = [
  {
    file: 'apps/api/src/modules/healthcheck/service.py',
    mustInclude: [
      'HealthcheckCurrentCause',
      "current_cause = self._current_cause(overall_record) if overall != 'pass' else None",
    ],
  },
  {
    file: 'apps/api/src/modules/healthcheck/domain.py',
    mustInclude: [
      "kind: str = 'historical'",
      'class HealthcheckCurrentCause',
    ],
  },
  {
    file: 'apps/web/src/app/healthcheck/page.tsx',
    mustInclude: [
      'Causa actual',
      'Bitácora histórica',
      'Eventos anteriores saneados. No representan necesariamente el estado activo',
      'Incidencia histórica',
      'No procede de la bitácora histórica',
    ],
    mustNotInclude: [
      'Eventos recientes',
    ],
  },
  {
    file: 'apps/api/tests/test_healthcheck_dashboard_api.py',
    mustInclude: [
      'test_healthcheck_current_cause_is_derived_from_current_records_not_historical_events',
      'test_healthcheck_pass_state_has_no_current_cause_even_with_historical_warning',
    ],
  },
  {
    file: 'docs/read-models.md',
    mustInclude: [
      'current_cause',
      'eventos históricos',
    ],
  },
]

let failed = false
for (const check of checks) {
  const content = readFileSync(check.file, 'utf8')
  for (const needle of check.mustInclude ?? []) {
    if (!content.includes(needle)) {
      console.error(`[healthcheck-review-clarity] ${check.file} must include: ${needle}`)
      failed = true
    }
  }
  for (const needle of check.mustNotInclude ?? []) {
    if (content.includes(needle)) {
      console.error(`[healthcheck-review-clarity] ${check.file} must not include stale copy: ${needle}`)
      failed = true
    }
  }
}

if (failed) {
  process.exit(1)
}

console.log('Healthcheck review clarity guardrail passed')

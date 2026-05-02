#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const checks = [
  {
    file: 'apps/api/src/modules/healthcheck/router.py',
    mustInclude: [
      'return HealthcheckService()',
      'fresh service per request',
    ],
    mustNotInclude: [
      '_service = HealthcheckService()',
    ],
  },
  {
    file: 'apps/api/src/modules/healthcheck/domain.py',
    mustInclude: [
      'HEALTHCHECK_OPERATIONAL_CHECK_IDS',
      "'gateways'",
      "'honcho'",
      "'docker_runtime'",
      "'cronjobs'",
      "'vault_sync'",
      "'backup'",
      'class HealthcheckOperationalCheck',
    ],
  },
  {
    file: 'apps/api/src/modules/healthcheck/service.py',
    mustInclude: [
      "'operational_checks'",
      'def _operational_checks',
      "'docker_runtime'",
      'Docker runtime crítico sin manifiesto operativo saneado',
      'Honcho sin manifiesto operativo saneado',
      'display_text',
      'metric_value',
      'failing_items',
    ],
  },
  {
    file: 'apps/web/src/app/healthcheck/page.tsx',
    mustInclude: [
      'Panel operativo',
      'Estado operativo actual',
      'Check operativo',
      'Sin datos sensibles',
      'operational_checks',
    ],
    mustNotInclude: [
      'Bitácora histórica',
      'Eventos anteriores saneados',
      'Incidencia histórica',
      'No procede de la bitácora histórica',
      'Eventos recientes',
    ],
  },
  {
    file: 'apps/api/tests/test_healthcheck_dashboard_api.py',
    mustInclude: [
      'test_healthcheck_router_builds_live_service_per_request',
      'operational_checks',
      'docker_runtime',
    ],
  },
]

const sensitiveNeedles = [
  'stdout',
  'stderr',
  'raw_output',
  'command',
  'pid',
  'container_id',
  'docker_id',
  'mount',
  'remote_url',
  'prompt_body',
  'chat_id',
  'delivery_target',
]

let failed = false
for (const check of checks) {
  const content = readFileSync(check.file, 'utf8')
  for (const needle of check.mustInclude ?? []) {
    if (!content.includes(needle)) {
      console.error(`[healthcheck-operational-panel] ${check.file} must include: ${needle}`)
      failed = true
    }
  }
  for (const needle of check.mustNotInclude ?? []) {
    if (content.includes(needle)) {
      console.error(`[healthcheck-operational-panel] ${check.file} must not include stale copy: ${needle}`)
      failed = true
    }
  }
}

const page = readFileSync('apps/web/src/app/healthcheck/page.tsx', 'utf8')
for (const needle of sensitiveNeedles) {
  if (page.toLowerCase().includes(needle)) {
    console.error(`[healthcheck-operational-panel] page must not render sensitive marker: ${needle}`)
    failed = true
  }
}

if (failed) {
  process.exit(1)
}

console.log('Healthcheck operational panel guardrail passed')

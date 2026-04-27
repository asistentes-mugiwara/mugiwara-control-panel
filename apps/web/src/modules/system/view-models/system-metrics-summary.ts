import type { SystemMetrics } from '@contracts/read-models'

import type { HeaderSystemMetrics, HeaderSystemMetricsSourceState } from '@/shared/ui/app-shell/system-metrics'

const UNKNOWN_CAPACITY_METRIC: SystemMetrics['ram'] = {
  used_bytes: null,
  total_bytes: null,
  used_percent: null,
  source_state: 'unknown',
}

const UNKNOWN_UPTIME_METRIC: SystemMetrics['uptime'] = {
  days: null,
  hours: null,
  minutes: null,
  source_state: 'unknown',
}

export function createUnavailableHeaderSystemMetrics(sourceState: HeaderSystemMetricsSourceState): HeaderSystemMetrics {
  return {
    ram: UNKNOWN_CAPACITY_METRIC,
    disk: UNKNOWN_CAPACITY_METRIC,
    uptime: UNKNOWN_UPTIME_METRIC,
    sourceState,
  }
}

export function createHeaderSystemMetricsSnapshot(metrics: SystemMetrics): HeaderSystemMetrics {
  return {
    ram: metrics.ram,
    disk: metrics.disk,
    uptime: metrics.uptime,
    sourceState: metrics.source_state === 'live' ? 'live' : 'degraded',
  }
}

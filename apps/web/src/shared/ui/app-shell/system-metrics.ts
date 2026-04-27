import type { SystemMetrics } from '@contracts/read-models'

export type HeaderSystemMetricsSourceState = 'live' | 'degraded' | 'not_configured' | 'unavailable'

export type HeaderSystemMetrics = {
  ram: SystemMetrics['ram']
  disk: SystemMetrics['disk']
  uptime: SystemMetrics['uptime']
  sourceState: HeaderSystemMetricsSourceState
}

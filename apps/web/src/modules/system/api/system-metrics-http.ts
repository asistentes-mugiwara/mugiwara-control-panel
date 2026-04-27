import 'server-only'

import type { SystemMetrics, SystemMetricsResponse } from '@contracts/read-models'

export const SYSTEM_METRICS_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

type SystemMetricsApiErrorCode = 'not_configured' | 'invalid_config' | `http_${number}` | 'invalid_payload' | 'fetch_failed'

export class SystemMetricsApiError extends Error {
  constructor(readonly code: SystemMetricsApiErrorCode) {
    super(code)
    this.name = 'SystemMetricsApiError'
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

function parseSystemMetricsApiBaseUrl(value: string) {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new SystemMetricsApiError('invalid_config')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SystemMetricsApiError('invalid_config')
  }

  return trimTrailingSlash(value)
}

export function getSystemMetricsApiBaseUrl() {
  const value = process.env[SYSTEM_METRICS_API_BASE_URL_ENV]
  return value ? parseSystemMetricsApiBaseUrl(value) : null
}

function isSystemMetricSourceState(value: unknown): value is SystemMetrics['ram']['source_state'] {
  return value === 'live' || value === 'unknown'
}

function isSystemMetricsState(value: unknown): value is SystemMetrics['source_state'] {
  return value === 'live' || value === 'degraded'
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isCapacityMetric(value: unknown): value is SystemMetrics['ram'] {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as SystemMetrics['ram']
  return (
    isNullableFiniteNumber(candidate.used_bytes) &&
    isNullableFiniteNumber(candidate.total_bytes) &&
    isNullableFiniteNumber(candidate.used_percent) &&
    isSystemMetricSourceState(candidate.source_state)
  )
}

function isUptimeMetric(value: unknown): value is SystemMetrics['uptime'] {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as SystemMetrics['uptime']
  return (
    isNullableFiniteNumber(candidate.days) &&
    isNullableFiniteNumber(candidate.hours) &&
    isNullableFiniteNumber(candidate.minutes) &&
    isSystemMetricSourceState(candidate.source_state)
  )
}

function isSystemMetrics(value: unknown): value is SystemMetrics {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as SystemMetrics
  return (
    isCapacityMetric(candidate.ram) &&
    isCapacityMetric(candidate.disk) &&
    isUptimeMetric(candidate.uptime) &&
    typeof candidate.updated_at === 'string' &&
    isSystemMetricsState(candidate.source_state)
  )
}

function parseSystemMetricsResponse(payload: unknown): SystemMetricsResponse {
  if (!payload || typeof payload !== 'object') {
    throw new SystemMetricsApiError('invalid_payload')
  }

  const candidate = payload as SystemMetricsResponse
  if (!isSystemMetrics(candidate.data)) {
    throw new SystemMetricsApiError('invalid_payload')
  }

  return candidate
}

export async function fetchSystemMetrics(): Promise<SystemMetricsResponse> {
  const baseUrl = getSystemMetricsApiBaseUrl()

  if (!baseUrl) {
    throw new SystemMetricsApiError('not_configured')
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/v1/system/metrics`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch {
    throw new SystemMetricsApiError('fetch_failed')
  }

  if (!response.ok) {
    throw new SystemMetricsApiError(`http_${response.status}`)
  }

  return parseSystemMetricsResponse(await response.json())
}

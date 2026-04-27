import 'server-only'

import http from 'node:http'
import https from 'node:https'

import type { UsageCalendarRange, UsageCalendarResponse, UsageCurrentResponse, UsageFiveHourWindowsResponse } from '@contracts/read-models'

export const USAGE_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

export class UsageApiError extends Error {
  status: number
  code: string

  constructor(message: string, options: { status: number; code: string }) {
    super(message)
    this.name = 'UsageApiError'
    this.status = options.status
    this.code = options.code
  }
}

type ApiErrorPayload = {
  detail?: {
    code?: string
    message?: string
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

function parseUsageApiBaseUrl(value: string) {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new UsageApiError('invalid_config', { status: 0, code: 'invalid_config' })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UsageApiError('invalid_config', { status: 0, code: 'invalid_config' })
  }

  return trimTrailingSlash(value)
}

export function getUsageApiBaseUrl() {
  const value = process.env[USAGE_API_BASE_URL_ENV]
  return value ? parseUsageApiBaseUrl(value) : null
}

function apiErrorFromPayload(payload: ApiErrorPayload | null, status: number) {
  return new UsageApiError(payload?.detail?.message ?? `http_${status}`, {
    status,
    code: payload?.detail?.code ?? `http_${status}`,
  })
}

function parseJsonPayload<T>(body: string): T {
  try {
    return JSON.parse(body) as T
  } catch {
    throw new UsageApiError('invalid_json', { status: 0, code: 'invalid_json' })
  }
}

async function requestUsageJson<T>(url: string): Promise<T> {
  const parsed = new URL(url)
  const transport = parsed.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const request = transport.request(
      parsed,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        timeout: 5000,
      },
      (response) => {
        const chunks: Buffer[] = []
        response.on('data', (chunk: Buffer) => chunks.push(chunk))
        response.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')
          const status = response.statusCode ?? 0

          if (status < 200 || status >= 300) {
            let payload: ApiErrorPayload | null = null
            try {
              payload = JSON.parse(body) as ApiErrorPayload
            } catch {
              payload = null
            }
            reject(apiErrorFromPayload(payload, status))
            return
          }

          try {
            resolve(parseJsonPayload<T>(body))
          } catch (error) {
            reject(error)
          }
        })
      },
    )

    request.on('timeout', () => {
      request.destroy(new UsageApiError('timeout', { status: 0, code: 'timeout' }))
    })
    request.on('error', (error) => {
      reject(error instanceof UsageApiError ? error : new UsageApiError('fetch_failed', { status: 0, code: 'fetch_failed' }))
    })
    request.end()
  })
}

export async function fetchUsageCurrent(): Promise<UsageCurrentResponse> {
  const baseUrl = getUsageApiBaseUrl()

  if (!baseUrl) {
    throw new UsageApiError('not_configured', { status: 0, code: 'not_configured' })
  }

  return requestUsageJson<UsageCurrentResponse>(`${baseUrl}/api/v1/usage/current`)
}

export async function fetchUsageCalendar(range: UsageCalendarRange = 'current_cycle'): Promise<UsageCalendarResponse> {
  const baseUrl = getUsageApiBaseUrl()

  if (!baseUrl) {
    throw new UsageApiError('not_configured', { status: 0, code: 'not_configured' })
  }

  const allowedRanges: UsageCalendarRange[] = ['current_cycle', 'previous_cycle', '7d', '30d']
  const safeRange = allowedRanges.includes(range) ? range : 'current_cycle'
  return requestUsageJson<UsageCalendarResponse>(`${baseUrl}/api/v1/usage/calendar?range=${encodeURIComponent(safeRange)}`)
}

export async function fetchUsageFiveHourWindows(limit = 8): Promise<UsageFiveHourWindowsResponse> {
  const baseUrl = getUsageApiBaseUrl()

  if (!baseUrl) {
    throw new UsageApiError('not_configured', { status: 0, code: 'not_configured' })
  }

  const safeLimit = Math.max(1, Math.min(24, Math.trunc(limit)))
  return requestUsageJson<UsageFiveHourWindowsResponse>(`${baseUrl}/api/v1/usage/five-hour-windows?limit=${safeLimit}`)
}

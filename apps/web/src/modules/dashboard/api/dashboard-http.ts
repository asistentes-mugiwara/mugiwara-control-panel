import 'server-only'

import type { DashboardSummaryResponse } from '@contracts/read-models'

export const DASHBOARD_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

export class DashboardApiError extends Error {
  status: number
  code: string

  constructor(message: string, options: { status: number; code: string }) {
    super(message)
    this.name = 'DashboardApiError'
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

function parseDashboardApiBaseUrl(value: string) {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new DashboardApiError('invalid_config', { status: 0, code: 'invalid_config' })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new DashboardApiError('invalid_config', { status: 0, code: 'invalid_config' })
  }

  return trimTrailingSlash(value)
}

export function getDashboardApiBaseUrl() {
  const value = process.env[DASHBOARD_API_BASE_URL_ENV]
  return value ? parseDashboardApiBaseUrl(value) : null
}

async function parseApiError(response: Response) {
  let payload: ApiErrorPayload | null = null

  try {
    payload = (await response.json()) as ApiErrorPayload
  } catch {
    payload = null
  }

  return new DashboardApiError(payload?.detail?.message ?? `http_${response.status}`, {
    status: response.status,
    code: payload?.detail?.code ?? `http_${response.status}`,
  })
}

export async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  const baseUrl = getDashboardApiBaseUrl()

  if (!baseUrl) {
    throw new DashboardApiError('not_configured', { status: 0, code: 'not_configured' })
  }

  const response = await fetch(`${baseUrl}/api/v1/dashboard`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  return (await response.json()) as DashboardSummaryResponse
}

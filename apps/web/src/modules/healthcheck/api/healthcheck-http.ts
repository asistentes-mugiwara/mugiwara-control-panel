import 'server-only'

import type { HealthcheckWorkspaceResponse } from '@contracts/read-models'

export const HEALTHCHECK_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

export class HealthcheckApiError extends Error {
  status: number
  code: string

  constructor(message: string, options: { status: number; code: string }) {
    super(message)
    this.name = 'HealthcheckApiError'
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

function parseHealthcheckApiBaseUrl(value: string) {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new HealthcheckApiError('invalid_config', { status: 0, code: 'invalid_config' })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new HealthcheckApiError('invalid_config', { status: 0, code: 'invalid_config' })
  }

  return trimTrailingSlash(value)
}

export function getHealthcheckApiBaseUrl() {
  const value = process.env[HEALTHCHECK_API_BASE_URL_ENV]
  return value ? parseHealthcheckApiBaseUrl(value) : null
}

async function parseApiError(response: Response) {
  let payload: ApiErrorPayload | null = null

  try {
    payload = (await response.json()) as ApiErrorPayload
  } catch {
    payload = null
  }

  return new HealthcheckApiError(payload?.detail?.message ?? `http_${response.status}`, {
    status: response.status,
    code: payload?.detail?.code ?? `http_${response.status}`,
  })
}

export async function fetchHealthcheckWorkspace(): Promise<HealthcheckWorkspaceResponse> {
  const baseUrl = getHealthcheckApiBaseUrl()

  if (!baseUrl) {
    throw new HealthcheckApiError('not_configured', { status: 0, code: 'not_configured' })
  }

  const response = await fetch(`${baseUrl}/api/v1/healthcheck`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  return (await response.json()) as HealthcheckWorkspaceResponse
}

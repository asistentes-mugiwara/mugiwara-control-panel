import 'server-only'

import type { MemoryDetailResponse, MemorySummaryResponse } from '@contracts/read-models'

export const MEMORY_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

export class MemoryApiError extends Error {
  status: number
  code: string

  constructor(message: string, options: { status: number; code: string }) {
    super(message)
    this.name = 'MemoryApiError'
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

function parseMemoryApiBaseUrl(value: string) {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new MemoryApiError('invalid_config', { status: 0, code: 'invalid_config' })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new MemoryApiError('invalid_config', { status: 0, code: 'invalid_config' })
  }

  return trimTrailingSlash(value)
}

export function getMemoryApiBaseUrl() {
  const value = process.env[MEMORY_API_BASE_URL_ENV]
  return value ? parseMemoryApiBaseUrl(value) : null
}

async function parseApiError(response: Response) {
  let payload: ApiErrorPayload | null = null

  try {
    payload = (await response.json()) as ApiErrorPayload
  } catch {
    payload = null
  }

  return new MemoryApiError(payload?.detail?.message ?? `http_${response.status}`, {
    status: response.status,
    code: payload?.detail?.code ?? `http_${response.status}`,
  })
}

export async function fetchMemorySummary(): Promise<MemorySummaryResponse> {
  const baseUrl = getMemoryApiBaseUrl()

  if (!baseUrl) {
    throw new MemoryApiError('not_configured', { status: 0, code: 'not_configured' })
  }

  const response = await fetch(`${baseUrl}/api/v1/memory`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  return (await response.json()) as MemorySummaryResponse
}

export async function fetchMemoryDetail(slug: string): Promise<MemoryDetailResponse> {
  const baseUrl = getMemoryApiBaseUrl()

  if (!baseUrl) {
    throw new MemoryApiError('not_configured', { status: 0, code: 'not_configured' })
  }

  const response = await fetch(`${baseUrl}/api/v1/memory/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  return (await response.json()) as MemoryDetailResponse
}

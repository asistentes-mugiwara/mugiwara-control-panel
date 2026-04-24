import 'server-only'

import type { MugiwarasCatalogResponse } from '@contracts/read-models'

export const MUGIWARAS_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

export class MugiwarasApiError extends Error {
  status: number
  code: string

  constructor(message: string, options: { status: number; code: string }) {
    super(message)
    this.name = 'MugiwarasApiError'
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

function parseMugiwarasApiBaseUrl(value: string) {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new MugiwarasApiError('invalid_config', { status: 0, code: 'invalid_config' })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new MugiwarasApiError('invalid_config', { status: 0, code: 'invalid_config' })
  }

  return trimTrailingSlash(value)
}

export function getMugiwarasApiBaseUrl() {
  const value = process.env[MUGIWARAS_API_BASE_URL_ENV]
  return value ? parseMugiwarasApiBaseUrl(value) : null
}

export async function fetchMugiwarasCatalog(): Promise<MugiwarasCatalogResponse> {
  const baseUrl = getMugiwarasApiBaseUrl()

  if (!baseUrl) {
    throw new MugiwarasApiError('not_configured', { status: 0, code: 'not_configured' })
  }

  const response = await fetch(`${baseUrl}/api/v1/mugiwaras`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null

    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      payload = null
    }

    throw new MugiwarasApiError(payload?.detail?.message ?? `http_${response.status}`, {
      status: response.status,
      code: payload?.detail?.code ?? `http_${response.status}`,
    })
  }

  return (await response.json()) as MugiwarasCatalogResponse
}

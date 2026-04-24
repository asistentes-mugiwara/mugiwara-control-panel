import 'server-only'

export const SKILLS_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

export type SkillsServerApiErrorCode =
  | 'not_configured'
  | 'validation_error'
  | 'unsupported_media_type'
  | 'stale'
  | 'forbidden'
  | 'not_found'
  | 'source_unavailable'
  | 'upstream_unavailable'
  | `http_${number}`

export type SkillsServerErrorPayload = {
  detail: {
    code: SkillsServerApiErrorCode
    message: string
  }
}

type ApiErrorPayload = {
  detail?: {
    code?: string
    message?: string
  }
}

export class SkillsServerApiError extends Error {
  status: number
  code: SkillsServerApiErrorCode

  constructor(message: string, options: { status: number; code: SkillsServerApiErrorCode }) {
    super(message)
    this.name = 'SkillsServerApiError'
    this.status = options.status
    this.code = options.code
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

function sanitizeUpstreamCode(status: number, code: string | undefined): SkillsServerApiErrorCode {
  if (
    code === 'validation_error' ||
    code === 'unsupported_media_type' ||
    code === 'stale' ||
    code === 'forbidden' ||
    code === 'not_found' ||
    code === 'source_unavailable' ||
    code === 'not_configured' ||
    code === 'upstream_unavailable'
  ) {
    return code
  }

  return `http_${status}`
}

function sanitizeUpstreamMessage(status: number, code: SkillsServerApiErrorCode, message: string | undefined) {
  if (message && !message.includes('://') && !message.includes('Traceback') && !message.includes('/srv/')) {
    return message
  }

  switch (code) {
    case 'not_configured':
      return 'La configuración server-only de Skills no está disponible.'
    case 'validation_error':
      return 'La petición no cumple el contrato de Skills.'
    case 'stale':
      return 'Fingerprint desactualizado; recarga la skill antes de guardar.'
    case 'forbidden':
      return 'Operación no permitida para esta skill allowlisted.'
    case 'not_found':
      return 'Skill no disponible en la allowlist.'
    case 'source_unavailable':
      return 'La fuente allowlisted de Skills no está disponible.'
    default:
      return `El backend de Skills respondió con estado ${status}.`
  }
}

export function getSkillsServerApiBaseUrl() {
  const value = process.env[SKILLS_API_BASE_URL_ENV]

  if (!value) {
    throw new SkillsServerApiError('La configuración server-only de Skills no está disponible.', {
      status: 503,
      code: 'not_configured',
    })
  }

  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new SkillsServerApiError('La configuración server-only de Skills no está disponible.', {
      status: 503,
      code: 'not_configured',
    })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SkillsServerApiError('La configuración server-only de Skills no está disponible.', {
      status: 503,
      code: 'not_configured',
    })
  }

  return trimTrailingSlash(value)
}

export async function fetchSkillsServerJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getSkillsServerApiBaseUrl()

  let response: Response

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
  } catch {
    throw new SkillsServerApiError('El backend de Skills no está disponible.', {
      status: 503,
      code: 'upstream_unavailable',
    })
  }

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null

    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      payload = null
    }

    const code = sanitizeUpstreamCode(response.status, payload?.detail?.code)
    throw new SkillsServerApiError(sanitizeUpstreamMessage(response.status, code, payload?.detail?.message), {
      status: response.status,
      code,
    })
  }

  return (await response.json()) as T
}

export function buildSkillsServerErrorPayload(error: SkillsServerApiError): SkillsServerErrorPayload {
  return {
    detail: {
      code: error.code,
      message: error.message,
    },
  }
}

export function normalizeSkillsServerError(error: unknown): SkillsServerApiError {
  if (error instanceof SkillsServerApiError) {
    return error
  }

  return new SkillsServerApiError('Error interno saneado en la frontera BFF de Skills.', {
    status: 500,
    code: 'upstream_unavailable',
  })
}

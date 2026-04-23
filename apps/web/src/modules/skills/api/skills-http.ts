import type {
  SkillAuditResponse,
  SkillDetailResponse,
  SkillPreviewResponse,
  SkillsCatalogResponse,
  SkillUpdateResponse,
} from '@contracts/skills'

type ApiErrorPayload = {
  detail?: {
    code?: string
    message?: string
  }
}

export class SkillsApiError extends Error {
  status: number
  code: string

  constructor(message: string, options: { status: number; code: string }) {
    super(message)
    this.name = 'SkillsApiError'
    this.status = options.status
    this.code = options.code
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

export function getSkillsApiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL
  return value ? trimTrailingSlash(value) : null
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getSkillsApiBaseUrl()

  if (!baseUrl) {
    throw new SkillsApiError('not_configured', { status: 0, code: 'not_configured' })
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null

    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      payload = null
    }

    throw new SkillsApiError(payload?.detail?.message ?? `http_${response.status}`, {
      status: response.status,
      code: payload?.detail?.code ?? `http_${response.status}`,
    })
  }

  return (await response.json()) as T
}

export function fetchSkillsCatalog() {
  return fetchJson<SkillsCatalogResponse>('/api/v1/skills')
}

export function fetchSkillDetail(skillId: string) {
  return fetchJson<SkillDetailResponse>(`/api/v1/skills/${skillId}`)
}

export function fetchSkillsAudit() {
  return fetchJson<SkillAuditResponse>('/api/v1/skills/audit')
}

export function fetchSkillPreview(skillId: string, payload: { content: string; expected_sha256: string }) {
  return fetchJson<SkillPreviewResponse>(`/api/v1/skills/${skillId}/preview`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSkill(skillId: string, payload: { actor: string; content: string; expected_sha256: string }) {
  return fetchJson<SkillUpdateResponse>(`/api/v1/skills/${skillId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

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

const SKILLS_BFF_BASE_PATH = '/api/control-panel/skills'

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

export function getSkillsApiConnectionLabel() {
  return 'BFF same-origin'
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SKILLS_BFF_BASE_PATH}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
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
  return fetchJson<SkillsCatalogResponse>('')
}

export function fetchSkillDetail(skillId: string) {
  return fetchJson<SkillDetailResponse>(`/${encodeURIComponent(skillId)}`)
}

export function fetchSkillsAudit() {
  return fetchJson<SkillAuditResponse>('/audit')
}

export function fetchSkillPreview(skillId: string, payload: { content: string; expected_sha256: string }) {
  return fetchJson<SkillPreviewResponse>(`/${encodeURIComponent(skillId)}/preview`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSkill(skillId: string, payload: { actor: string; content: string; expected_sha256: string }) {
  return fetchJson<SkillUpdateResponse>(`/${encodeURIComponent(skillId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

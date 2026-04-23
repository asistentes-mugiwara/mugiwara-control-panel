import type {
  SkillAuditResponse,
  SkillDetailResponse,
  SkillPreviewResponse,
  SkillsCatalogResponse,
} from '@contracts/skills'

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
    throw new Error('not_configured')
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
    throw new Error(`http_${response.status}`)
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

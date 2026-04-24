import 'server-only'

import type { VaultWorkspace } from '@/modules/vault/view-models/vault-workspace.fixture'

export const VAULT_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

type VaultWorkspaceResponse = {
  data: VaultWorkspace
}

export class VaultApiError extends Error {
  constructor(readonly code: 'not_configured' | `http_${number}` | 'invalid_payload') {
    super(code)
    this.name = 'VaultApiError'
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

export function getVaultApiBaseUrl() {
  const value = process.env[VAULT_API_BASE_URL_ENV]

  if (!value) {
    return null
  }

  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    return null
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null
  }

  return trimTrailingSlash(value)
}

export async function fetchVaultWorkspace(): Promise<VaultWorkspace> {
  const baseUrl = getVaultApiBaseUrl()

  if (!baseUrl) {
    throw new VaultApiError('not_configured')
  }

  const response = await fetch(`${baseUrl}/api/v1/vault`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new VaultApiError(`http_${response.status}`)
  }

  const payload = (await response.json()) as VaultWorkspaceResponse

  if (!payload.data) {
    throw new VaultApiError('invalid_payload')
  }

  return payload.data
}

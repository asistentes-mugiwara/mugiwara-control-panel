import 'server-only'

import type { VaultWorkspace } from '@/modules/vault/view-models/vault-workspace.fixture'

export const VAULT_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

type VaultWorkspaceResponse = {
  data: VaultWorkspace
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
    throw new Error('not_configured')
  }

  const response = await fetch(`${baseUrl}/api/v1/vault`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`http_${response.status}`)
  }

  const payload = (await response.json()) as VaultWorkspaceResponse
  return payload.data
}

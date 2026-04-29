import 'server-only'

import type { VaultExplorerTree, VaultMarkdownDocument } from '@/modules/vault/view-models/vault-explorer.fixture'

export const VAULT_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

type VaultTreeResponse = {
  data: VaultExplorerTree
}

type VaultDocumentResponse = {
  data: VaultMarkdownDocument
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

function encodeVaultDocumentPath(relativePath: string) {
  return relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function assertTreePayload(value: unknown): asserts value is VaultExplorerTree {
  const data = value as Partial<VaultExplorerTree> | null
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.documents) || data.read_only !== true || data.sanitized !== true) {
    throw new VaultApiError('invalid_payload')
  }
}

function assertDocumentPayload(value: unknown): asserts value is VaultMarkdownDocument {
  const data = value as Partial<VaultMarkdownDocument> | null
  if (!data || typeof data.relative_path !== 'string' || typeof data.markdown !== 'string' || data.read_only !== true) {
    throw new VaultApiError('invalid_payload')
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = getVaultApiBaseUrl()

  if (!baseUrl) {
    throw new VaultApiError('not_configured')
  }

  const response = await fetch(`${baseUrl}${path}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new VaultApiError(`http_${response.status}`)
  }

  return (await response.json()) as T
}

export async function fetchVaultTree(): Promise<VaultExplorerTree> {
  const payload = await fetchJson<VaultTreeResponse>('/api/v1/vault/tree')
  assertTreePayload(payload.data)
  return payload.data
}

export async function fetchVaultDocument(relativePath: string): Promise<VaultMarkdownDocument> {
  const payload = await fetchJson<VaultDocumentResponse>(`/api/v1/vault/documents/${encodeVaultDocumentPath(relativePath)}`)
  assertDocumentPayload(payload.data)
  return payload.data
}

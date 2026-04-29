import { redirect } from 'next/navigation'

import { VaultApiError, fetchVaultDocument, fetchVaultTree } from '@/modules/vault/api/vault-http'
import {
  vaultExplorerFixture,
  vaultMarkdownFixture,
  type VaultExplorerTree,
  type VaultMarkdownDocument,
} from '@/modules/vault/view-models/vault-explorer.fixture'

import { VaultClient } from './VaultClient'

export const dynamic = 'force-dynamic'

type VaultPageNotice = {
  status: 'ready' | 'fallback'
  code?: string
}

type VaultPageState = {
  tree: VaultExplorerTree
  document: VaultMarkdownDocument | null
  selectedPath: string | null
  notice: VaultPageNotice
}

type VaultPageSearchParams = Promise<Record<string, string | string[] | undefined>>

type VaultPageProps = {
  searchParams?: VaultPageSearchParams
}

function getSingleSearchParam(searchParams: Record<string, string | string[] | undefined>, key: 'path') {
  const value = searchParams[key]
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

function hasUnsupportedVaultSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  return Object.keys(searchParams).some((key) => key !== 'path')
}

function isNextRedirectError(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'digest' in error &&
      String((error as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT'),
  )
}

function isSafeSelectedPath(tree: VaultExplorerTree, selectedPath: string | undefined): selectedPath is string {
  if (!selectedPath) return false
  return tree.documents.some((document) => document.relative_path === selectedPath)
}

function vaultDocumentHref(relativePath: string) {
  return `/vault?path=${encodeURIComponent(relativePath)}`
}

async function loadVaultPage(searchParams: Record<string, string | string[] | undefined>): Promise<VaultPageState> {
  if (hasUnsupportedVaultSearchParams(searchParams)) {
    redirect('/vault')
  }

  const requestedPath = getSingleSearchParam(searchParams, 'path')

  try {
    const tree = await fetchVaultTree()
    const selectedPath = isSafeSelectedPath(tree, requestedPath) ? requestedPath : (tree.documents[0]?.relative_path ?? null)

    if (requestedPath && selectedPath !== requestedPath) {
      redirect(selectedPath ? vaultDocumentHref(selectedPath) : '/vault')
    }

    const document = selectedPath ? await fetchVaultDocument(selectedPath) : null

    if (document && document.relative_path !== selectedPath) {
      redirect('/vault')
    }

    return {
      tree,
      document,
      selectedPath,
      notice: { status: 'ready' },
    }
  } catch (error) {
    if (isNextRedirectError(error)) throw error

    if (requestedPath) {
      redirect('/vault')
    }

    return {
      tree: vaultExplorerFixture,
      document: vaultMarkdownFixture,
      selectedPath: vaultMarkdownFixture.relative_path,
      notice: { status: 'fallback', code: error instanceof VaultApiError ? error.code : 'fetch_failed' },
    }
  }
}

export default async function VaultPage({ searchParams }: VaultPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const { tree, document, selectedPath, notice } = await loadVaultPage(resolvedSearchParams)

  return <VaultClient document={document} notice={notice} selectedPath={selectedPath} tree={tree} />
}

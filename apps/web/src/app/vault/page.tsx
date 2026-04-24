import { VaultApiError, fetchVaultWorkspace } from '@/modules/vault/api/vault-http'
import { vaultWorkspaceFixture } from '@/modules/vault/view-models/vault-workspace.fixture'

import { VaultClient } from './VaultClient'

export const dynamic = 'force-dynamic'

type VaultPageState = {
  workspace: typeof vaultWorkspaceFixture
  apiState: 'ready' | 'fallback'
  apiErrorCode?: string
}

async function loadVaultWorkspace(): Promise<VaultPageState> {
  try {
    return {
      workspace: await fetchVaultWorkspace(),
      apiState: 'ready',
    }
  } catch (error) {
    return {
      workspace: vaultWorkspaceFixture,
      apiState: 'fallback',
      apiErrorCode: error instanceof VaultApiError ? error.code : 'fetch_failed',
    }
  }
}

export default async function VaultPage() {
  const { workspace, apiState, apiErrorCode } = await loadVaultWorkspace()

  return <VaultClient apiErrorCode={apiErrorCode} apiState={apiState} initialWorkspace={workspace} />
}

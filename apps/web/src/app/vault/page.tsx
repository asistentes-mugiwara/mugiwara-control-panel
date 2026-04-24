import { fetchVaultWorkspace } from '@/modules/vault/api/vault-http'
import { vaultWorkspaceFixture } from '@/modules/vault/view-models/vault-workspace.fixture'

import { VaultClient } from './VaultClient'

export const dynamic = 'force-dynamic'

export default async function VaultPage() {
  const workspace = await fetchVaultWorkspace().catch(() => vaultWorkspaceFixture)

  return <VaultClient initialWorkspace={workspace} />
}

export type VaultBreadcrumb = {
  label: string
  href: string
}

export type VaultFreshness = {
  updated_at: string
  label: string
  state: 'fresh' | 'stale'
}

export type VaultIndexEntry = {
  id: string
  label: string
  path_segment: string
  kind: 'directory' | 'document'
  summary: string
  anchor: `#${string}`
}

export type VaultIndex = {
  path: string
  breadcrumbs: VaultBreadcrumb[]
  freshness: VaultFreshness
  entries: VaultIndexEntry[]
}

export const vaultIndexFixture: VaultIndex = {
  path: '/vault',
  breadcrumbs: [
    { label: 'Vault', href: '/vault' },
    { label: 'Índice allowlisted', href: '/vault#index-root' },
  ],
  freshness: {
    updated_at: '2026-04-23T15:08:00Z',
    label: 'Actualizado hace 7 min',
    state: 'fresh',
  },
  entries: [
    {
      id: 'ops-playbooks',
      label: 'Ops Playbooks',
      path_segment: 'ops/playbooks',
      kind: 'directory',
      summary: 'Runbooks curados para operación y respuesta, visibles solo por allowlist.',
      anchor: '#ops-playbooks',
    },
    {
      id: 'memory-notes',
      label: 'Memory Notes',
      path_segment: 'notes/memory',
      kind: 'document',
      summary: 'Notas saneadas de continuidad documental, separadas explícitamente de la memoria viva.',
      anchor: '#memory-notes',
    },
    {
      id: 'frontend-decisions',
      label: 'Frontend Decisions',
      path_segment: 'frontend/decisions',
      kind: 'directory',
      summary: 'Índice de decisiones y handoffs de UI disponibles para lectura controlada.',
      anchor: '#frontend-decisions',
    },
  ],
}

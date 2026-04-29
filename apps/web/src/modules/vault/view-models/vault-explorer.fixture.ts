export type VaultExplorerNode = {
  id: string
  name: string
  relative_path: string
  kind: 'directory' | 'document'
  depth: number
  size_bytes?: number | null
  updated_at?: string | null
}

export type VaultDocumentRef = {
  id: string
  name: string
  relative_path: string
  size_bytes: number
  updated_at: string
}

export type VaultExplorerTree = {
  safe_root: 'canonical_vault'
  read_only: true
  sanitized: true
  max_depth: number
  max_nodes: number
  max_document_bytes: number
  limits: {
    nodes_truncated: boolean
  }
  nodes: VaultExplorerNode[]
  documents: VaultDocumentRef[]
}

export type VaultMarkdownDocument = {
  relative_path: string
  name: string
  markdown: string
  updated_at: string
  size_bytes: number
  read_only: true
}

export const vaultExplorerFixture: VaultExplorerTree = {
  safe_root: 'canonical_vault',
  read_only: true,
  sanitized: true,
  max_depth: 8,
  max_nodes: 600,
  max_document_bytes: 524288,
  limits: {
    nodes_truncated: false,
  },
  nodes: [
    {
      id: 'project-summary-mugiwara-control-panel',
      name: 'Project Summary - Mugiwara Control Panel.md',
      relative_path: '03-Projects/Project Summary - Mugiwara Control Panel.md',
      kind: 'document',
      depth: 1,
      size_bytes: 1337,
      updated_at: '2026-04-29T12:00:00Z',
    },
    {
      id: 'policy-memory-governance',
      name: 'Policy - Memory governance.md',
      relative_path: '00-System/Policy - Memory governance.md',
      kind: 'document',
      depth: 1,
      size_bytes: 900,
      updated_at: '2026-04-29T12:00:00Z',
    },
    {
      id: 'playbook-pr-governance',
      name: 'Playbook - PR governance Zoro Franky Chopper Usopp.md',
      relative_path: '06-Playbooks/Playbook - PR governance Zoro Franky Chopper Usopp.md',
      kind: 'document',
      depth: 1,
      size_bytes: 1200,
      updated_at: '2026-04-29T12:00:00Z',
    },
  ],
  documents: [
    {
      id: 'project-summary-mugiwara-control-panel',
      name: 'Project Summary - Mugiwara Control Panel.md',
      relative_path: '03-Projects/Project Summary - Mugiwara Control Panel.md',
      size_bytes: 1337,
      updated_at: '2026-04-29T12:00:00Z',
    },
    {
      id: 'policy-memory-governance',
      name: 'Policy - Memory governance.md',
      relative_path: '00-System/Policy - Memory governance.md',
      size_bytes: 900,
      updated_at: '2026-04-29T12:00:00Z',
    },
    {
      id: 'playbook-pr-governance',
      name: 'Playbook - PR governance Zoro Franky Chopper Usopp.md',
      relative_path: '06-Playbooks/Playbook - PR governance Zoro Franky Chopper Usopp.md',
      size_bytes: 1200,
      updated_at: '2026-04-29T12:00:00Z',
    },
  ],
}

export const vaultMarkdownFixture: VaultMarkdownDocument = {
  relative_path: '03-Projects/Project Summary - Mugiwara Control Panel.md',
  name: 'Project Summary - Mugiwara Control Panel.md',
  updated_at: '2026-04-29T12:00:00Z',
  size_bytes: 1337,
  read_only: true,
  markdown: `---
title: Mugiwara Control Panel
status: fallback-saneado
---

# Mugiwara Control Panel

Fallback local saneado para mantener la experiencia de lectura cuando la API privada no está disponible.

## Qué muestra esta página

- Explorador de documentos Markdown permitidos.
- Lector Markdown renderizado sin HTML ejecutable.
- Enlaces saneados y solo lectura real de extremo a extremo.

| Superficie | Estado |
| --- | --- |
| Vault | Solo lectura |
| Markdown | Render conservador |

> Este fallback no representa lectura en vivo del vault.

\`\`\`text
sin escritura, sin rutas absolutas host, sin backend URL en cliente
\`\`\`
`,
}

export type VaultBreadcrumb = {
  label: string
  href: string
}

export type VaultFreshness = {
  updated_at: string
  label: string
  state: 'fresh' | 'stale'
}

export type VaultTreeEntry = {
  id: string
  label: string
  path_segment: string
  kind: 'directory' | 'document'
  summary: string
  depth: number
  path: string
}

export type VaultDocumentSection = {
  heading: string
  body: string[]
}

export type VaultDocumentMeta = {
  path: string
  updated_at: string
  toc: string[]
  context: string
}

export type VaultDocument = {
  id: string
  title: string
  summary: string
  canon_callout: string
  breadcrumbs: VaultBreadcrumb[]
  meta: VaultDocumentMeta
  sections: VaultDocumentSection[]
}

export type VaultWorkspace = {
  freshness: VaultFreshness
  tree: VaultTreeEntry[]
  active_document_id: string
  documents: VaultDocument[]
}

export const vaultWorkspaceFixture: VaultWorkspace = {
  freshness: {
    updated_at: '2026-04-24T07:32:00Z',
    label: 'Canon refrescado esta mañana',
    state: 'fresh',
  },
  tree: [
    {
      id: 'ops-playbooks',
      label: 'Ops Playbooks',
      path_segment: 'ops/playbooks',
      kind: 'directory',
      summary: 'Runbooks curados para operación y respuesta, visibles por allowlist.',
      depth: 0,
      path: '/vault/ops/playbooks',
    },
    {
      id: 'nightly-review',
      label: 'Nightly Public Review',
      path_segment: 'nightly-public-review',
      kind: 'document',
      summary: 'Criterio editorial de revisión nocturna para escaparate público.',
      depth: 1,
      path: '/vault/ops/playbooks/nightly-public-review',
    },
    {
      id: 'frontend-decisions',
      label: 'Frontend Decisions',
      path_segment: 'frontend/decisions',
      kind: 'directory',
      summary: 'Decisiones de UI y handoffs estabilizados del panel.',
      depth: 0,
      path: '/vault/frontend/decisions',
    },
    {
      id: 'memory-vs-vault',
      label: 'Memory vs Vault',
      path_segment: 'memory-vs-vault',
      kind: 'document',
      summary: 'Separación canónica entre memoria operativa y canon curado.',
      depth: 1,
      path: '/vault/frontend/decisions/memory-vs-vault',
    },
    {
      id: 'project-summaries',
      label: 'Project Summaries',
      path_segment: 'projects/summaries',
      kind: 'directory',
      summary: 'Resúmenes canónicos de proyectos software y operativos.',
      depth: 0,
      path: '/vault/projects/summaries',
    },
    {
      id: 'mcp-summary',
      label: 'MCP Summary',
      path_segment: 'mugiwara-control-panel',
      kind: 'document',
      summary: 'Resumen curado del estado funcional actual del control panel.',
      depth: 1,
      path: '/vault/projects/summaries/mugiwara-control-panel',
    },
  ],
  active_document_id: 'mcp-summary',
  documents: [
    {
      id: 'mcp-summary',
      title: 'Mugiwara Control Panel — Project Summary',
      summary: 'Documento canónico del estado del MVP, rutas activas y decisiones duraderas del frontend.',
      canon_callout: 'Vault es canon curado: resume decisiones y estado estable. No sustituye ni duplica la memoria operativa de Memory.',
      breadcrumbs: [
        { label: 'Vault', href: '/vault' },
        { label: 'Project Summaries', href: '/vault#project-summaries' },
        { label: 'Mugiwara Control Panel', href: '/vault#mcp-summary' },
      ],
      meta: {
        path: 'projects/summaries/mugiwara-control-panel.md',
        updated_at: '2026-04-24T07:28:00Z',
        toc: ['Estado del MVP', 'Superficies activas', 'Decisiones estables', 'Siguiente tramo'],
        context: 'Resumen editorial para retomar el proyecto sin arrastrar trazas efímeras de implementación.',
      },
      sections: [
        {
          heading: 'Estado del MVP',
          body: [
            'El shell principal del panel está operativo y las rutas dashboard, mugiwaras, skills, memory y vault ya presentan superficies útiles.',
            'Skills sigue siendo la única frontera editable del MVP y ya dispone de flujo de preview y guardado controlado contra backend real.',
          ],
        },
        {
          heading: 'Superficies activas',
          body: [
            'Mugiwaras usa identidad visual con calaveras SVG y mapping canónico de 10 perfiles.',
            'Memory ofrece selector por Mugiwara y tabs Built-in/Honcho sobre fixtures saneadas.',
            'Vault debe sentirse documental y editorial, no operativa por fuente como Memory.',
          ],
        },
        {
          heading: 'Decisiones estables',
          body: [
            'No abrir superficies de escritura fuera de skills.',
            'Mantener separación estricta entre memory, vault y engram.',
            'Usar assets estáticos del frontend para crests y reutilizarlos con componentes compartidos.',
          ],
        },
        {
          heading: 'Siguiente tramo',
          body: [
            'Tras cerrar Vault, el siguiente frente funcional del MVP es Healthcheck.',
            'Los refinamientos de componentes compartidos deben quedar subordinados a la secuencia de fases del producto.',
          ],
        },
      ],
    },
    {
      id: 'memory-vs-vault',
      title: 'Memory vs Vault — separación canónica',
      summary: 'Regla editorial para diferenciar memoria operativa de canon duradero.',
      canon_callout: 'La UI debe hacer visible que Memory y Vault sirven a necesidades distintas aunque compartan contexto Mugiwara.',
      breadcrumbs: [
        { label: 'Vault', href: '/vault' },
        { label: 'Frontend Decisions', href: '/vault#frontend-decisions' },
        { label: 'Memory vs Vault', href: '/vault#memory-vs-vault' },
      ],
      meta: {
        path: 'frontend/decisions/memory-vs-vault.md',
        updated_at: '2026-04-24T07:12:00Z',
        toc: ['Propósito', 'Memory', 'Vault'],
        context: 'Decisión editorial para evitar mezclar contextos operativos y documentales en la UI.',
      },
      sections: [
        {
          heading: 'Propósito',
          body: ['Memory debe responder a continuidad operativa por fuente y agente; Vault a lectura documental y canon curado.'],
        },
        {
          heading: 'Memory',
          body: ['Por fuente, por Mugiwara, con estados operativos y lectura resumida.'],
        },
        {
          heading: 'Vault',
          body: ['Navegable, editorial, con breadcrumbs, metadatos y documento legible.'],
        },
      ],
    },
    {
      id: 'nightly-review',
      title: 'Nightly Public Review — playbook',
      summary: 'Playbook curado de revisión nocturna para repos públicos escaparate.',
      canon_callout: 'El playbook resume criterio reutilizable; la ejecución diaria y sus incidencias viven fuera del canon.',
      breadcrumbs: [
        { label: 'Vault', href: '/vault' },
        { label: 'Ops Playbooks', href: '/vault#ops-playbooks' },
        { label: 'Nightly Public Review', href: '/vault#nightly-review' },
      ],
      meta: {
        path: 'ops/playbooks/nightly-public-review.md',
        updated_at: '2026-04-24T06:58:00Z',
        toc: ['Objetivo', 'Criterio', 'Salida esperada'],
        context: 'Runbook curado para repos escaparate con política deny-by-default.',
      },
      sections: [
        {
          heading: 'Objetivo',
          body: ['Revisar si existe contenido público seguro y con valor real para publicar en el escaparate.'],
        },
        {
          heading: 'Criterio',
          body: ['Solo publicar si el cambio es seguro, representativo y no revela operación privada.'],
        },
        {
          heading: 'Salida esperada',
          body: ['Decisión clara: sin-cambios o propuesta concreta de actualización pública.'],
        },
      ],
    },
  ],
}

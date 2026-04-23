export type MemoryAgentSummary = {
  mugiwara_slug: string
  summary: string
  fact_count: number
  last_updated: string
  badges: string[]
}

export const memoryAgentSummaryFixture: MemoryAgentSummary[] = [
  {
    mugiwara_slug: 'zoro',
    summary: 'Mantiene continuidad de arquitectura, tareas activas y decisiones recientes de frontend.',
    fact_count: 6,
    last_updated: '2026-04-23T15:12:00Z',
    badges: ['arquitectura', 'shell', 'continuidad'],
  },
  {
    mugiwara_slug: 'usopp',
    summary: 'Resume estado documental, handoffs vigentes y puntos abiertos de implementación UI.',
    fact_count: 5,
    last_updated: '2026-04-23T15:04:00Z',
    badges: ['docs', 'handoff', 'ui-spec'],
  },
  {
    mugiwara_slug: 'nami',
    summary: 'Conserva facts operativos para navegación, prioridades de rutas y señales de observabilidad.',
    fact_count: 4,
    last_updated: '2026-04-23T14:58:00Z',
    badges: ['navegación', 'prioridades', 'observabilidad'],
  },
]

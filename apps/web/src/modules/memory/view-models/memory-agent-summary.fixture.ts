import type { MugiwaraSlug } from '@/shared/mugiwara/crest-map'

export type MemoryAgentSummary = {
  mugiwara_slug: MugiwaraSlug
  summary: string
  fact_count: number
  last_updated: string
  badges: string[]
}

export const memoryAgentSummaryFixture: MemoryAgentSummary[] = [
  {
    mugiwara_slug: 'luffy',
    summary: 'Coordina briefs, prioridades y delegación diaria entre especialistas.',
    fact_count: 6,
    last_updated: '2026-04-24T07:20:00Z',
    badges: ['orquestación', 'briefs', 'prioridades'],
  },
  {
    mugiwara_slug: 'zoro',
    summary: 'Mantiene continuidad técnica, verify y decisiones recientes de software.',
    fact_count: 6,
    last_updated: '2026-04-24T07:25:00Z',
    badges: ['arquitectura', 'verify', 'software'],
  },
  {
    mugiwara_slug: 'franky',
    summary: 'Conserva topología operativa, automatizaciones y continuidad de infraestructura.',
    fact_count: 5,
    last_updated: '2026-04-24T07:03:00Z',
    badges: ['infra', 'backups', 'automatización'],
  },
  {
    mugiwara_slug: 'nami',
    summary: 'Resume presupuestos, previsiones y señales de prioridad financiera.',
    fact_count: 5,
    last_updated: '2026-04-24T06:55:00Z',
    badges: ['finanzas', 'presupuesto', 'prioridades'],
  },
  {
    mugiwara_slug: 'usopp',
    summary: 'Agrupa handoffs, decisiones de UI y material editorial del frontend.',
    fact_count: 5,
    last_updated: '2026-04-24T07:10:00Z',
    badges: ['docs', 'handoff', 'ui'],
  },
  {
    mugiwara_slug: 'robin',
    summary: 'Conserva investigaciones estructuradas y fuentes contrastadas.',
    fact_count: 4,
    last_updated: '2026-04-24T06:48:00Z',
    badges: ['research', 'fuentes', 'síntesis'],
  },
  {
    mugiwara_slug: 'jinbe',
    summary: 'Mantiene criterios legales, contratos y trámites públicos relevantes.',
    fact_count: 4,
    last_updated: '2026-04-24T06:36:00Z',
    badges: ['legal', 'contratos', 'boe'],
  },
  {
    mugiwara_slug: 'sanji',
    summary: 'Recoge logística física, reservas y comparativas operativas del mundo real.',
    fact_count: 4,
    last_updated: '2026-04-24T06:26:00Z',
    badges: ['logística', 'reservas', 'ofertas'],
  },
  {
    mugiwara_slug: 'chopper',
    summary: 'Agrupa hallazgos de seguridad, postura defensiva y auditorías técnicas.',
    fact_count: 4,
    last_updated: '2026-04-24T06:18:00Z',
    badges: ['ciberseguridad', 'auditoría', 'riesgo'],
  },
  {
    mugiwara_slug: 'brook',
    summary: 'Conserva continuidad de datos, bases relacionales y análisis de patrones.',
    fact_count: 4,
    last_updated: '2026-04-24T06:12:00Z',
    badges: ['datos', 'postgres', 'análisis'],
  },
]

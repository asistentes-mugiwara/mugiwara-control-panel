export type MugiwaraCardStatus = 'healthy' | 'warning' | 'degraded'

export type MugiwaraCardLink = {
  label: string
  href: '/memory' | '/skills'
}

export type MugiwaraCard = {
  slug: string
  name: string
  status: MugiwaraCardStatus
  skills: string[]
  memory_badge: string
  links: MugiwaraCardLink[]
}

export const mugiwaraCardFixture: MugiwaraCard[] = [
  {
    slug: 'zoro',
    name: 'Zoro',
    status: 'healthy',
    skills: ['sdd-orchestrator-zoro', 'sdd-design-zoro'],
    memory_badge: 'Continuidad fuerte',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'usopp',
    name: 'Usopp',
    status: 'warning',
    skills: ['frontend-spec-usopp', 'ui-handoff-usopp'],
    memory_badge: 'Docs recientes',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'nami',
    name: 'Nami',
    status: 'healthy',
    skills: ['routing-nami', 'observability-nami'],
    memory_badge: 'Señales estables',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'sanji',
    name: 'Sanji',
    status: 'degraded',
    skills: ['ops-surface-sanji'],
    memory_badge: 'Requiere revisión',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
]

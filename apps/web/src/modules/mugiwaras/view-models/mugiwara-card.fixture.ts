import type { MugiwaraCard } from '@contracts/read-models'

export const mugiwaraCardFixture: MugiwaraCard[] = [
  {
    slug: 'luffy',
    name: 'Luffy',
    status: 'operativo',
    skills: ['delegation-contract', 'crew-orchestration'],
    memory_badge: 'Capitán operativo',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'zoro',
    name: 'Zoro',
    status: 'operativo',
    skills: ['sdd-orchestrator-zoro', 'zoro-pr-review-handoff'],
    memory_badge: 'Continuidad fuerte',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'franky',
    name: 'Franky',
    status: 'operativo',
    skills: ['franky-pr-ops-review', 'vault-sync-ops'],
    memory_badge: 'Runtime vigilado',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'chopper',
    name: 'Chopper',
    status: 'operativo',
    skills: ['chopper-pr-security-review', 'security-hardening'],
    memory_badge: 'Riesgo controlado',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'usopp',
    name: 'Usopp',
    status: 'revision',
    skills: ['usopp-pr-design-review', 'frontend-spec-usopp'],
    memory_badge: 'Diseño activo',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'nami',
    name: 'Nami',
    status: 'operativo',
    skills: ['finance-ops', 'google-sheets-control'],
    memory_badge: 'Señales estables',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'robin',
    name: 'Robin',
    status: 'operativo',
    skills: ['research-synthesis', 'vault-canon'],
    memory_badge: 'Canon consultable',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'brook',
    name: 'Brook',
    status: 'revision',
    skills: ['data-analysis', 'analytics-standby'],
    memory_badge: 'Datos en standby',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'jinbe',
    name: 'Jinbe',
    status: 'sin-datos',
    skills: ['legal-context'],
    memory_badge: 'Definido en canon',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
  {
    slug: 'sanji',
    name: 'Sanji',
    status: 'sin-datos',
    skills: ['physical-ops'],
    memory_badge: 'Definido en canon',
    links: [
      { label: 'Abrir Memory', href: '/memory' },
      { label: 'Abrir Skills', href: '/skills' },
    ],
  },
]

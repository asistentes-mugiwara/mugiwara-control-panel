import type { MugiwaraCard } from '@contracts/read-models'

export const mugiwaraCardFixture: MugiwaraCard[] = [
  {
    slug: 'luffy',
    name: 'Luffy',
    status: 'operativo',
    description: 'Coordina prioridades, reparte trabajo entre especialistas y cierra decisiones ejecutivas.',
    skills: ['delegation-contract', 'crew-orchestration'],
    memory_badge: 'Capitán operativo',
    links: [
      { label: 'Ver Memory', href: '/memory' },
      { label: 'Ver Skills', href: '/skills' },
    ],
  },
  {
    slug: 'zoro',
    name: 'Zoro',
    status: 'operativo',
    description: 'Diseña, implementa y valida software: arquitectura, PRs, testing y calidad técnica.',
    skills: ['sdd-orchestrator-zoro', 'zoro-pr-review-handoff'],
    memory_badge: 'Continuidad fuerte',
    links: [
      { label: 'Ver Memory', href: '/memory' },
      { label: 'Ver Skills', href: '/skills' },
    ],
  },
  {
    slug: 'franky',
    name: 'Franky',
    status: 'operativo',
    description: 'Opera infraestructura, servicios, automatizaciones, backups y salud del runtime.',
    skills: ['franky-pr-ops-review', 'vault-sync-ops'],
    memory_badge: 'Runtime vigilado',
    links: [
      { label: 'Ver Memory', href: '/memory' },
      { label: 'Ver Skills', href: '/skills' },
    ],
  },
  {
    slug: 'chopper',
    name: 'Chopper',
    status: 'operativo',
    description: 'Vigila seguridad, permisos, secretos, dependencias y exposición accidental.',
    skills: ['chopper-pr-security-review', 'security-hardening'],
    memory_badge: 'Riesgo controlado',
    links: [
      { label: 'Ver Memory', href: '/memory' },
      { label: 'Ver Skills', href: '/skills' },
    ],
  },
  {
    slug: 'usopp',
    name: 'Usopp',
    status: 'revision',
    description: 'Convierte ideas en marca, copy, diseño, campañas y experiencia de interfaz.',
    skills: ['usopp-pr-design-review', 'frontend-spec-usopp'],
    memory_badge: 'Diseño activo',
    links: [
      { label: 'Ver Memory', href: '/memory' },
      { label: 'Ver Skills', href: '/skills' },
    ],
  },
  {
    slug: 'nami',
    name: 'Nami',
    status: 'operativo',
    description: 'Ordena finanzas, hojas de cálculo, métricas económicas y control operativo.',
    skills: ['finance-ops', 'google-sheets-control'],
    memory_badge: 'Señales estables',
    links: [
      { label: 'Ver Memory', href: '/memory' },
      { label: 'Ver Skills', href: '/skills' },
    ],
  },
  {
    slug: 'robin',
    name: 'Robin',
    status: 'operativo',
    description: 'Investiga, sintetiza contexto, mantiene canon y separa memoria útil de ruido.',
    skills: ['research-synthesis', 'vault-canon'],
    memory_badge: 'Canon consultable',
    links: [
      { label: 'Ver Memory', href: '/memory' },
      { label: 'Ver Skills', href: '/skills' },
    ],
  },
  {
    slug: 'brook',
    name: 'Brook',
    status: 'revision',
    description: 'Analiza datos, modelos, métricas y pipelines cuando el sistema necesite lectura cuantitativa.',
    skills: ['data-analysis', 'analytics-standby'],
    memory_badge: 'Datos en standby',
    links: [
      { label: 'Ver Memory', href: '/memory' },
      { label: 'Ver Skills', href: '/skills' },
    ],
  },
  {
    slug: 'jinbe',
    name: 'Jinbe',
    status: 'sin-datos',
    description: 'Aporta criterio legal, contexto normativo y lectura prudente de riesgos jurídicos.',
    skills: ['legal-context'],
    memory_badge: 'Definido en canon',
    links: [
      { label: 'Ver Memory', href: '/memory' },
      { label: 'Ver Skills', href: '/skills' },
    ],
  },
  {
    slug: 'sanji',
    name: 'Sanji',
    status: 'sin-datos',
    description: 'Cuida operaciones físicas, logística personal y soporte de alto contacto cuando aplique.',
    skills: ['physical-ops'],
    memory_badge: 'Definido en canon',
    links: [
      { label: 'Ver Memory', href: '/memory' },
      { label: 'Ver Skills', href: '/skills' },
    ],
  },
]

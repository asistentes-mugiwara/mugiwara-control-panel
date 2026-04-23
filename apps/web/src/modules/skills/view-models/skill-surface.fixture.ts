export type SkillSurfaceCardStatus = 'healthy' | 'warning' | 'degraded'

export type SkillExposureMode = 'allowlisted-edit' | 'read-only-reference'

export type SkillSurfaceLink = {
  label: string
  href: '/mugiwaras' | '/memory' | '#edit-boundary' | '#audit-minimum'
}

export type SkillSurfaceCard = {
  skill_id: string
  title: string
  owner: string
  status: SkillSurfaceCardStatus
  exposure: SkillExposureMode
  summary: string
  diff_mode: string
  last_reviewed: string
  links: SkillSurfaceLink[]
}

export type SkillSurfaceSummary = {
  boundary_rules: string[]
  audit_minimum: string[]
  denied_patterns: string[]
  cards: SkillSurfaceCard[]
}

export const skillSurfaceFixture: SkillSurfaceSummary = {
  boundary_rules: [
    'Solo backend decide la allowlist editable; el frontend nunca resuelve paths libres.',
    'La escritura del MVP queda limitada a SKILL.md autorizados por identificador interno.',
    'Cualquier skill fuera de allowlist permanece visible solo como referencia read-only.',
    'La edición real exige diff resumido y metadata mínima antes de aceptar el guardado.',
  ],
  audit_minimum: [
    'skill_id estable resuelto por backend',
    'autor operativo del guardado',
    'timestamp visible para auditoría',
    'resumen corto del diff aplicado',
  ],
  denied_patterns: [
    'path arbitrario enviado desde el cliente',
    'edición libre de ficheros fuera de SKILL.md autorizado',
    'escritura sin diff resumido ni rastro de auditoría',
    'exposición de secretos, rutas privadas o payloads crudos del runtime',
  ],
  cards: [
    {
      skill_id: 'zoro-opencode-operator',
      title: 'OpenCode operator',
      owner: 'zoro',
      status: 'healthy',
      exposure: 'allowlisted-edit',
      summary: 'Skill operativa de trabajo diario en OpenCode, apta para edición solo si backend la marca como autorizada.',
      diff_mode: 'diff resumido obligatorio',
      last_reviewed: '2026-04-23 08:10 CET',
      links: [
        { label: 'Ver frontera', href: '#edit-boundary' },
        { label: 'Abrir Mugiwaras', href: '/mugiwaras' },
      ],
    },
    {
      skill_id: 'mugiwara-git-identity',
      title: 'Git identity governance',
      owner: 'shared',
      status: 'warning',
      exposure: 'allowlisted-edit',
      summary: 'Skill transversal sensible: editable solo bajo allowlist y con trazabilidad, porque impacta repos y firma operativa.',
      diff_mode: 'metadata + diff resumido',
      last_reviewed: '2026-04-22 19:40 CET',
      links: [
        { label: 'Ver auditoría', href: '#audit-minimum' },
        { label: 'Abrir Memory', href: '/memory' },
      ],
    },
    {
      skill_id: 'judgment-day',
      title: 'Judgment Day',
      owner: 'runtime',
      status: 'healthy',
      exposure: 'read-only-reference',
      summary: 'Disponible como referencia operativa del runtime; visible aquí sin abrir todavía edición real desde la UI.',
      diff_mode: 'sin edición en esta fase',
      last_reviewed: '2026-04-23 07:55 CET',
      links: [
        { label: 'Ver frontera', href: '#edit-boundary' },
        { label: 'Ver auditoría', href: '#audit-minimum' },
      ],
    },
  ],
}

import type { MugiwaraSlug } from '@/shared/mugiwara/crest-map'

export type MemorySourceState = 'initialized' | 'unavailable' | 'stale' | 'error'
export type MemorySourceKey = 'built-in' | 'honcho'

export type MemorySourceSnapshot = {
  state: MemorySourceState
  updated_at: string
  summary: string
  availability: string
  facts: string[]
}

export type MemoryAgentDetail = {
  mugiwara_slug: MugiwaraSlug
  built_in: MemorySourceSnapshot
  honcho: MemorySourceSnapshot
}

export const memoryAgentDetailFixture: MemoryAgentDetail[] = [
  {
    mugiwara_slug: 'luffy',
    built_in: {
      state: 'initialized',
      updated_at: '2026-04-24T07:20:00Z',
      summary: 'Resume delegaciones del día, prioridades activas y criterios de coordinación entre especialistas.',
      availability: 'Inicializada y disponible en el runtime local.',
      facts: ['Prioriza ejecución rápida con contexto suficiente.', 'Escala dudas transversales antes de cerrar cambios.', 'Centraliza briefs y seguimiento del trabajo delegado.'],
    },
    honcho: {
      state: 'initialized',
      updated_at: '2026-04-24T07:14:00Z',
      summary: 'Mantiene señales relacionales de coordinación y continuidad con Pablo y el resto de Mugiwara.',
      availability: 'Resumen híbrido disponible.',
      facts: ['Coordina tono y foco entre especialistas.', 'Recoge hábitos de colaboración transversales.', 'No sustituye memoria viva de proyecto.'],
    },
  },
  {
    mugiwara_slug: 'zoro',
    built_in: {
      state: 'initialized',
      updated_at: '2026-04-24T07:25:00Z',
      summary: 'Conserva continuidad de arquitectura, decisiones técnicas y cierres verificables de software.',
      availability: 'Inicializada con facts visibles.',
      facts: ['OpenCode es runtime principal para trabajo software serio.', 'Skills es la única superficie editable del MVP.', 'Verify razonable es requisito antes de cierre.'],
    },
    honcho: {
      state: 'initialized',
      updated_at: '2026-04-24T07:18:00Z',
      summary: 'Aporta contexto relacional compartido con Pablo, sin invadir memoria viva del repo.',
      availability: 'Resumen disponible.',
      facts: ['Pablo prefiere español de España.', 'Prefiere recomendaciones firmes con plan breve.', 'La coordinación general sigue pasando por Luffy.'],
    },
  },
  {
    mugiwara_slug: 'franky',
    built_in: {
      state: 'initialized',
      updated_at: '2026-04-24T07:03:00Z',
      summary: 'Recoge topología de runtime, backups, automatizaciones y decisiones de infraestructura.',
      availability: 'Inicializada y accesible.',
      facts: ['Gestiona servidores Linux y despliegues.', 'Custodia backups y automatizaciones operativas.', 'Mantiene continuidad de sistema y redes.'],
    },
    honcho: {
      state: 'stale',
      updated_at: '2026-04-23T23:40:00Z',
      summary: 'Último resumen relacional disponible, pendiente de refresco tras cambios recientes de infraestructura.',
      availability: 'Disponible con frescura degradada.',
      facts: ['Coordina temas operativos con Luffy.', 'Comparte señales transversales de mantenimiento.', 'Requiere refresco tras incidencias nocturnas.'],
    },
  },
  {
    mugiwara_slug: 'nami',
    built_in: {
      state: 'initialized',
      updated_at: '2026-04-24T06:55:00Z',
      summary: 'Resume presupuestos, previsiones y decisiones de priorización financiera.',
      availability: 'Inicializada.',
      facts: ['Domina números, presupuestos y hojas de cálculo.', 'Aterriza decisiones económicas operativas.', 'Apoya priorización por impacto y coste.'],
    },
    honcho: {
      state: 'initialized',
      updated_at: '2026-04-24T06:42:00Z',
      summary: 'Mantiene señales de coordinación financiera con el resto de la tripulación.',
      availability: 'Disponible.',
      facts: ['Resume dependencias de decisiones presupuestarias.', 'Conecta impacto económico con prioridades.', 'Sirve como contexto relacional, no como ledger.'],
    },
  },
  {
    mugiwara_slug: 'usopp',
    built_in: {
      state: 'initialized',
      updated_at: '2026-04-24T07:10:00Z',
      summary: 'Agrupa handoffs, decisiones de UI y material editorial vigente del frontend.',
      availability: 'Inicializada con docs recientes.',
      facts: ['Custodia imagen de marca y UI/UX.', 'Mantiene specs y handoffs de frontend.', 'Refuerza coherencia entre identidad y claridad.'],
    },
    honcho: {
      state: 'initialized',
      updated_at: '2026-04-24T07:01:00Z',
      summary: 'Recoge señales de comunicación y tono comercial compartido con Pablo.',
      availability: 'Disponible.',
      facts: ['Sostiene copy y posicionamiento.', 'Ajusta tono externo según contexto.', 'No sustituye documentación de producto.'],
    },
  },
  {
    mugiwara_slug: 'robin',
    built_in: {
      state: 'initialized',
      updated_at: '2026-04-24T06:48:00Z',
      summary: 'Conserva investigaciones, fuentes contrastadas y resúmenes estructurados.',
      availability: 'Inicializada.',
      facts: ['Especialista en búsquedas profundas.', 'Sintetiza fuentes y evidencias.', 'Estructura research reutilizable.'],
    },
    honcho: {
      state: 'initialized',
      updated_at: '2026-04-24T06:31:00Z',
      summary: 'Mantiene contexto relacional útil para research transversal y continuidad editorial.',
      availability: 'Disponible.',
      facts: ['Relaciona hallazgos con necesidades de la tripulación.', 'Reduce duplicación de research.', 'No sustituye canon del vault.'],
    },
  },
  {
    mugiwara_slug: 'jinbe',
    built_in: {
      state: 'initialized',
      updated_at: '2026-04-24T06:36:00Z',
      summary: 'Resume criterios legales, contratos y trámites públicos relevantes para operación segura.',
      availability: 'Inicializada.',
      facts: ['Cubre leyes, BOE, impuestos y contratos.', 'Actúa como escudo burocrático del sistema.', 'Aporta criterio legal sin contaminar otras memorias.'],
    },
    honcho: {
      state: 'unavailable',
      updated_at: '2026-04-23T20:10:00Z',
      summary: 'No hay aún resumen relacional suficiente para Jinbe en Honcho.',
      availability: 'Fuente no inicializada para este perfil.',
      facts: ['Pendiente de primeras interacciones relacionales.', 'La ausencia de resumen no bloquea la lectura built-in.'],
    },
  },
  {
    mugiwara_slug: 'sanji',
    built_in: {
      state: 'initialized',
      updated_at: '2026-04-24T06:26:00Z',
      summary: 'Conserva criterios de logística física, reservas y comparativas de ofertas.',
      availability: 'Inicializada.',
      facts: ['Gestiona operaciones del mundo real.', 'Compara precios y organiza reservas.', 'Sirve como concierge personal y operativo.'],
    },
    honcho: {
      state: 'stale',
      updated_at: '2026-04-23T18:54:00Z',
      summary: 'Resumen disponible pero no refrescado con las últimas preferencias logísticas.',
      availability: 'Disponible con frescura degradada.',
      facts: ['Conviene refrescar tras nuevos viajes o compras.', 'El contexto base sigue siendo útil.'],
    },
  },
  {
    mugiwara_slug: 'chopper',
    built_in: {
      state: 'initialized',
      updated_at: '2026-04-24T06:18:00Z',
      summary: 'Recoge hallazgos de ciberseguridad, auditorías y postura defensiva del sistema.',
      availability: 'Inicializada.',
      facts: ['Busca vulnerabilidades proactivamente.', 'Protege código y servidores.', 'Aporta criterio de endurecimiento y riesgo.'],
    },
    honcho: {
      state: 'error',
      updated_at: '2026-04-24T05:59:00Z',
      summary: 'El último resumen relacional falló y requiere nueva generación.',
      availability: 'Error de fuente; sin síntesis útil reciente.',
      facts: ['La memoria built-in sigue disponible.', 'Conviene reintentar la generación de resumen.'],
    },
  },
  {
    mugiwara_slug: 'brook',
    built_in: {
      state: 'initialized',
      updated_at: '2026-04-24T06:12:00Z',
      summary: 'Agrupa continuidad de datos, bases relacionales y análisis de patrones.',
      availability: 'Inicializada.',
      facts: ['Gestiona PostgreSQL/Supabase.', 'Analiza datos con Python/Pandas.', 'Extrae patrones y señales a escala.'],
    },
    honcho: {
      state: 'initialized',
      updated_at: '2026-04-24T05:54:00Z',
      summary: 'Mantiene contexto relacional sobre colaboración con datos y reporting transversal.',
      availability: 'Disponible.',
      facts: ['Aporta contexto de consumo de datos por otras áreas.', 'Sirve para continuidad transversal de análisis.', 'No reemplaza datasets ni notebooks.'],
    },
  },
]

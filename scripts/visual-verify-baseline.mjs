#!/usr/bin/env node

const viewports = [
  {
    id: 'desktop',
    label: 'Desktop',
    size: '1440×900',
    checks: [
      'shell estable con sidebar visible y topbar sticky',
      'headers, pills y badges con jerarquía clara',
      'sin bloques rotos ni columnas colapsadas fuera de su layout esperado',
    ],
  },
  {
    id: 'tablet',
    label: 'Tablet',
    size: '1024×768',
    checks: [
      'sidebar colapsable o shell compactado sin pérdida de navegación',
      'layouts laterales apilan paneles con dignidad cuando falta ancho',
      'chips, badges y acciones hacen wrap sin micro-overflows',
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    size: '390×844',
    checks: [
      'prioridad absoluta a lectura en una columna',
      'sin desbordes horizontales en headers, code/previews o pills',
      'navegación móvil, foco y scroll siguen siendo utilizables',
    ],
  },
]

const routes = [
  {
    path: '/dashboard',
    title: 'Estado del barco',
    checks: [
      'KPIs visibles sin truncados torpes',
      'cards de severidad/frescura/módulos mantienen ritmo visual',
      'accesos rápidos envuelven bien en tablet/mobile',
      'si la API no está configurada, el aviso indica Modo fallback local, Snapshot saneado y No tiempo real',
    ],
  },
  {
    path: '/mugiwaras',
    title: 'Tripulación',
    checks: [
      'cards de agentes no cortan slug/rol/skills enlazadas',
      'chips de skills y links secundarios hacen wrap limpio',
      'la identidad Mugiwara sigue visible sin saturar el layout',
      'si cae a fixture, el aviso distingue fixture saneado de AGENTS.md canónico API-backed',
    ],
  },
  {
    path: '/skills',
    title: 'Skills',
    checks: [
      'workspace, frontera de edición y auditoría conservan orden al apilarse',
      'skill_id, fingerprint, repo_path y preview largo no rompen el contenedor',
      'estados vacíos/no configurados siguen siendo legibles en viewport estrecho',
      'la fuente distingue API real conectada, fuente no configurada, sin datos productivos o error degradado',
    ],
  },
  {
    path: '/memory',
    title: 'Memoria operativa',
    checks: [
      'selector de Mugiwara y panel de fuentes bajan bien a stacked layout',
      'facts, badges y tabs mantienen lectura clara en móvil',
      'estados stale/error/sin datos no desplazan mal la jerarquía',
      'fallback visible queda marcado como snapshot saneado/no tiempo real',
    ],
  },
  {
    path: '/vault',
    title: 'Vault',
    checks: [
      'árbol, documento y metadatos colapsan sin forzar tres columnas en ancho medio',
      'breadcrumbs, path y TOC no producen overflow horizontal',
      'la lectura documental sigue siendo dominante frente a la ficha lateral',
      'fallback documental local queda distinguido de lectura API real',
    ],
  },
  {
    path: '/healthcheck',
    title: 'Salud del sistema',
    checks: [
      'resumen actual, causa actual, módulos, bitácora histórica y señales respetan wrap y stacking',
      'la causa actual aparece antes del grid y antes de la bitácora histórica cuando hay incidencia o advertencia',
      'badges de estado/severidad no duplican el mismo significado visual',
      'checks sanos mantienen menor peso visual que incidencias o advertencias',
      'si la API no está configurada, queda claro que los checks son snapshot local saneado y no tiempo real',
      'principios de seguridad y badges semánticos siguen legibles en móvil',
      'ninguna card crítica rompe el grid en tablet',
    ],
  },
  {
    path: '/usage',
    title: 'Uso Codex/Hermes',
    checks: [
      'las cards de Tokens Hermes, Ventana semanal, Ventana 5h y Cuenta Codex apilan sin overflow',
      'el ciclo se etiqueta como ciclo semanal Codex y no como calendario lunes-domingo',
      'stale, not_configured o fallback quedan visibles como fuente degradada/no tiempo real',
      'fórmulas y privacidad hacen wrap sin filtrar detalles internos del host',
      'el calendario por fecha natural aparece como grid/cards responsive sin scroll horizontal obligatorio',
      'las ventanas 5h históricas aparecen como lista/cards responsive sin scroll horizontal obligatorio',
      'la actividad Hermes agregada aparece como lista/cards responsive sin scroll horizontal obligatorio',
      'la correlación Hermes/Codex se describe como orientativa, no causalidad exacta',
    ],
  },
]

function renderMarkdown() {
  const lines = []
  lines.push('# Visual verify baseline')
  lines.push('')
  lines.push('## Viewports canónicos')
  for (const viewport of viewports) {
    lines.push(`### ${viewport.label} — ${viewport.size}`)
    for (const check of viewport.checks) {
      lines.push(`- [ ] ${check}`)
    }
    lines.push('')
  }

  lines.push('## Rutas canónicas')
  for (const route of routes) {
    lines.push(`### ${route.path} — ${route.title}`)
    for (const check of route.checks) {
      lines.push(`- [ ] ${check}`)
    }
    lines.push('')
  }

  lines.push('## Cierre mínimo')
  lines.push('- [ ] revisar consola del navegador en la ruta inspeccionada')
  lines.push('- [ ] confirmar ausencia de overflow horizontal obvio')
  lines.push('- [ ] anotar incidencias visuales por ruta/viewport antes de cerrar un bloque UI')
  return lines.join('\n')
}

function renderJson() {
  return JSON.stringify({ viewports, routes }, null, 2)
}

const mode = process.argv.includes('--json') ? 'json' : 'markdown'
process.stdout.write(mode === 'json' ? renderJson() : renderMarkdown())

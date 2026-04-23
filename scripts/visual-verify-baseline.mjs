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
    ],
  },
  {
    path: '/mugiwaras',
    title: 'Tripulación',
    checks: [
      'cards de agentes no cortan slug/rol/skills enlazadas',
      'chips de skills y links secundarios hacen wrap limpio',
      'la identidad Mugiwara sigue visible sin saturar el layout',
    ],
  },
  {
    path: '/skills',
    title: 'Skills',
    checks: [
      'workspace, frontera de edición y auditoría conservan orden al apilarse',
      'skill_id, fingerprint, repo_path y preview largo no rompen el contenedor',
      'estados vacíos/no configurados siguen siendo legibles en viewport estrecho',
    ],
  },
  {
    path: '/memory',
    title: 'Memoria operativa',
    checks: [
      'selector de Mugiwara y panel de fuentes bajan bien a stacked layout',
      'facts, badges y tabs mantienen lectura clara en móvil',
      'estados stale/error/sin datos no desplazan mal la jerarquía',
    ],
  },
  {
    path: '/vault',
    title: 'Vault',
    checks: [
      'árbol, documento y metadatos colapsan sin forzar tres columnas en ancho medio',
      'breadcrumbs, path y TOC no producen overflow horizontal',
      'la lectura documental sigue siendo dominante frente a la ficha lateral',
    ],
  },
  {
    path: '/healthcheck',
    title: 'Salud del sistema',
    checks: [
      'resumen agregado, módulos, eventos y señales respetan wrap y stacking',
      'principios de seguridad y badges semánticos siguen legibles en móvil',
      'ninguna card crítica rompe el grid en tablet',
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

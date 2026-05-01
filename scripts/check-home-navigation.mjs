#!/usr/bin/env node
/** Static contract check for issue #127 home/start navigation. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const paths = {
  home: join(repoRoot, 'apps/web/src/app/page.tsx'),
  dashboard: join(repoRoot, 'apps/web/src/app/dashboard/page.tsx'),
  appShell: join(repoRoot, 'apps/web/src/shared/ui/app-shell/AppShell.tsx'),
  topbar: join(repoRoot, 'apps/web/src/shared/ui/app-shell/Topbar.tsx'),
  nav: join(repoRoot, 'apps/web/src/shared/ui/navigation/SidebarNav.tsx'),
  css: join(repoRoot, 'apps/web/src/app/globals.css'),
  visualBaseline: join(repoRoot, 'scripts/visual-verify-baseline.mjs'),
  frontendSpec: join(repoRoot, 'docs/frontend-ui-spec.md'),
}

const read = (path) => readFileSync(path, 'utf8')
const home = read(paths.home)
const dashboard = read(paths.dashboard)
const appShell = read(paths.appShell)
const topbar = read(paths.topbar)
const nav = read(paths.nav)
const css = read(paths.css)
const visualBaseline = read(paths.visualBaseline)
const frontendSpec = read(paths.frontendSpec)
const failures = []

function mustInclude(source, snippet, label) {
  if (!source.includes(snippet)) failures.push(`${label} must include ${snippet}`)
}

function mustNotInclude(source, snippet, label) {
  if (source.includes(snippet)) failures.push(`${label} must not include ${snippet}`)
}

mustNotInclude(home, "redirect('/dashboard')", 'home page')
mustInclude(home, 'Inicio', 'home page')
mustInclude(home, 'homeRouteCards', 'home page')
for (const href of ['/mugiwaras', '/skills', '/memory', '/vault', '/healthcheck', '/git', '/usage']) {
  mustInclude(home, `href: '${href}'`, 'home route cards')
}
mustNotInclude(home, "href: '/'", 'home route cards')
mustNotInclude(home, 'fetchDashboardSummary', 'home page')
mustNotInclude(home, 'dashboardSummaryFixture', 'home page')

mustInclude(dashboard, "redirect('/')", 'dashboard alias')
mustNotInclude(dashboard, 'fetchDashboardSummary', 'dashboard alias')
mustNotInclude(dashboard, 'Estado del barco', 'dashboard alias')

mustInclude(nav, "{ href: '/', label: 'Inicio'", 'sidebar navigation')
mustNotInclude(nav, "label: 'Dashboard'", 'sidebar navigation')
mustInclude(nav, "{ href: '/usage', label: 'Uso'", 'sidebar navigation')

mustInclude(appShell, 'const isHomePage = pathname === \'/\'', 'AppShell')
mustInclude(appShell, '!isHomePage ? (', 'AppShell')
mustInclude(appShell, 'showNavigation={!isHomePage}', 'AppShell/Topbar wiring')
mustInclude(topbar, 'showNavigation?: boolean', 'Topbar props')
mustInclude(topbar, '{showNavigation ? (', 'Topbar')

mustInclude(css, '.app-shell--home', 'home shell CSS')
mustInclude(css, '.home-hero', 'home CSS')
mustInclude(css, '.home-route-card', 'home cards CSS')
mustInclude(css, '.home-route-grid', 'home grid CSS')

mustInclude(visualBaseline, "path: '/'", 'visual baseline')
mustNotInclude(visualBaseline, "path: '/dashboard'", 'visual baseline')
mustInclude(frontendSpec, '`/` — Inicio', 'frontend UI spec')
mustInclude(frontendSpec, '`/dashboard` redirige a `/`', 'frontend UI spec')

if (failures.length > 0) {
  console.error('Home navigation contract check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Home navigation contract check passed')

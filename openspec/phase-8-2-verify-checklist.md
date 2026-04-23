# Verify checklist — phase 8.2 web shell foundation

- [ ] existe `AppShell` y se integra desde `src/app/layout.tsx`
- [ ] existe `SidebarNav` con las 6 rutas canónicas
- [ ] existe `Topbar`
- [ ] existe `PageHeader`
- [ ] existe `SurfaceCard`
- [ ] existe `StatusBadge`
- [ ] `dashboard` ya vive dentro del shell real
- [ ] existen placeholders finos para `mugiwaras`, `skills`, `memory`, `vault` y `healthcheck`
- [ ] `memory` y `vault` siguen separados explícitamente
- [ ] `skills` no abre aún edición real
- [ ] `npm --prefix apps/web run typecheck` pasa
- [ ] `npm --prefix apps/web run build` pasa
- [ ] `.gitignore` sigue cubriendo `.next/` y `node_modules/`
- [ ] el worktree no contiene artefactos de build ni secretos

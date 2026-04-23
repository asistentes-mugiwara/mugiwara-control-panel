# Verify checklist — phase 8.3 dashboard + healthcheck readonly

- [ ] existe fixture tipada para `dashboard.summary`
- [ ] existe fixture tipada para `healthcheck.summary[]`
- [ ] `/dashboard` muestra contadores agregados
- [ ] `/dashboard` muestra `highest severity` y frescura de datos
- [ ] `/dashboard` incluye enlaces a módulos propietarios
- [ ] `/healthcheck` muestra checks saneados con `status`
- [ ] `/healthcheck` muestra frescura por check
- [ ] `/healthcheck` muestra warning corto saneado
- [ ] `/healthcheck` muestra origen saneado por check
- [ ] `severity` y `status` se mapean de forma explícita (sin mezclar semánticas)
- [ ] las páginas `app/*` permanecen delgadas y read-only
- [ ] `npm --prefix apps/web run typecheck` pasa
- [ ] `npm --prefix apps/web run build` pasa
- [ ] `.gitignore` sigue cubriendo artefactos frontend (`.next/`, `node_modules/`)
- [ ] el worktree no contiene secretos ni artefactos de build

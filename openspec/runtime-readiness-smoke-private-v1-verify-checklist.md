# Runtime readiness smoke — verify checklist

## Preflight repo/vault
- [x] `git status --short --branch` ejecutado en `main` antes de crear rama.
- [x] `git log --oneline --decorate -5` ejecutado.
- [x] `gh issue view 40 --json state,url` confirma Issue #40 cerrada.
- [x] Rama `zoro/runtime-readiness-smoke` creada.

## Alcance
- [x] Scope limitado a smoke runtime web+API, `/healthcheck`, timers/manifests reales, guardrails y no-leakage básico.
- [x] Sin features nuevas.
- [x] Sin fuentes Healthcheck nuevas.
- [x] Sin capacidades Git nuevas.

## Guardrails principales
- [x] `npm run verify:perimeter-policy`
- [x] `npm run verify:health-dashboard-server-only`
- [x] `npm run verify:healthcheck-source-policy`
- [x] `npm run verify:vault-sync-status-producer`
- [x] `npm run verify:vault-sync-status-runner`
- [x] `npm run verify:backup-health-status-producer`
- [x] `npm run verify:backup-health-status-runner`
- [x] `npm run verify:project-health-runner`
- [x] `npm run verify:gateway-status-runner`
- [x] `npm run verify:cronjobs-status-runner`
- [x] `npm run verify:git-server-only`

## Build/tests
- [x] `npm --prefix apps/web run typecheck`
- [x] `PYTHONPATH=. pytest apps/api/tests -q`
- [x] `npm --prefix apps/web run build`

## Runtime smoke
- [x] FastAPI arrancado en loopback.
- [x] Next.js arrancado en loopback con `MUGIWARA_CONTROL_PANEL_API_URL` server-only apuntando al API local.
- [x] `GET /api/v1/healthcheck` devuelve 200 y `meta.sanitized=true`.
- [x] `/healthcheck` devuelve 200.
- [x] `/healthcheck` muestra contenido Healthcheck real sin fallback por API caída.

## Timers/manifests reales
- [x] Cinco timers Healthcheck user-level activos.
- [x] Cinco manifests existen y son JSON mapping.
- [x] Permisos no públicos en manifests.
- [x] No-leakage básico en manifests.

## No-leakage básico
- [x] API `/api/v1/healthcheck` sin backend URL, `.env`, stdout/stderr, traceback, tokens ni rutas sensibles obvias.
- [x] HTML `/healthcheck` sin backend URL, env names, `.env`, stdout/stderr, traceback, tokens ni rutas sensibles obvias.
- [x] Respuestas HTTP sin errores crudos.

## Cierre
- [x] Resultados documentados.
- [x] `.engram` closeout creado.
- [x] `git diff --check` pasa.
- [x] Decisión listo/no listo registrada.

# Runtime readiness smoke — private v1

## Objetivo
Ejecutar una microfase pequeña de smoke runtime para decidir si el control plane puede declararse operativo privado v1, sin abrir features nuevas ni añadir fuentes Healthcheck/Git.

## Contexto
- PR #94 está mergeada y Issue #40 cerrada.
- La Git control page queda cerrada hasta una eventual 40.6+ explícita.
- El Project Summary del vault ya recomienda este smoke como siguiente paso.

## Alcance mínimo elegido
1. **Web + API**: levantar FastAPI y Next.js en loopback, con `MUGIWARA_CONTROL_PANEL_API_URL` server-only apuntando al API local de la rama.
2. **`/healthcheck`**: comprobar endpoint FastAPI `GET /api/v1/healthcheck` y página web `/healthcheck` consumiendo backend real, no fixture por API caída.
3. **Timers/manifests reales**: verificar los cinco timers user-level y los cinco manifests Healthcheck existentes:
   - `vault-sync-status`
   - `backup-health-status`
   - `project-health-status`
   - `gateway-status`
   - `cronjobs-status`
4. **Guardrails principales**: ejecutar checks estáticos de perímetro, Healthcheck producers/runners y superficies server-only relevantes para el smoke.
5. **No-leakage básico**: escanear respuestas API/HTML contra canarios y marcadores sensibles básicos: backend URL, env names públicas/privadas, `.env`, `stdout`, `stderr`, `traceback`, rutas internas obvias y tokens.

## Fuera de alcance
- Nuevas features.
- Nuevas fuentes Healthcheck.
- Nuevas capacidades Git.
- Cambios de UI/copy salvo documentación del smoke.
- Cambios de runtime, timers, manifests, permisos o unidades systemd.
- Auth pública, exposición a internet o hardening nuevo.

## Definition of Done
- Repo/vault de partida verificados.
- Rama `zoro/runtime-readiness-smoke` creada desde `main` limpio.
- OpenSpec, checklist y closeout `.engram` registran el smoke.
- Verify real ejecutado y documentado con resultados por superficie.
- Decisión explícita: listo/no listo para operativo privado v1.

## Criterio de readiness
Se puede declarar **operativo privado v1** si:
- API y web arrancan en loopback.
- `/api/v1/healthcheck` responde 200 con `meta.sanitized=true`.
- `/healthcheck` responde 200 usando backend real y no filtra topología ni errores crudos.
- Los cinco timers existen y están activos.
- Los cinco manifests existen, son JSON mapping, tienen permisos no públicos y no contienen marcadores sensibles básicos.
- Los guardrails principales pasan.
- No aparecen fugas básicas en API/HTML.

Si falla cualquier punto crítico, el resultado debe ser **no listo**, con bloqueo concreto y siguiente acción recomendada.

## Verify planificado
- `git status --short --branch`
- `git log --oneline --decorate -5`
- `gh issue view 40 --json state,url`
- `npm run verify:perimeter-policy`
- `npm run verify:health-dashboard-server-only`
- `npm run verify:healthcheck-source-policy`
- `npm run verify:vault-sync-status-producer`
- `npm run verify:vault-sync-status-runner`
- `npm run verify:backup-health-status-producer`
- `npm run verify:backup-health-status-runner`
- `npm run verify:project-health-runner`
- `npm run verify:gateway-status-runner`
- `npm run verify:cronjobs-status-runner`
- `npm run verify:git-server-only`
- `npm --prefix apps/web run typecheck`
- `PYTHONPATH=. pytest apps/api/tests -q`
- `npm --prefix apps/web run build`
- `systemctl --user is-active` de los cinco timers
- validación shape/permisos/no-leakage de manifests reales
- smoke API `GET /api/v1/healthcheck`
- smoke web `/healthcheck`
- scan no-leakage básico sobre respuestas API/HTML
- `git diff --check`


## Resultados ejecutados

### Preflight
- Repo de partida en `main...origin/main`, limpio antes de crear la rama.
- Últimos commits: `95a09a0` merge PR #94, `4b3a087`, `755f65c`, `ab10ba5`, `e782354`.
- Issue #40 confirmado `CLOSED`: https://github.com/asistentes-mugiwara/mugiwara-control-panel/issues/40.
- Rama creada: `zoro/runtime-readiness-smoke`.

### Guardrails, tests y build
Pasaron:
- `npm run verify:perimeter-policy`
- `npm run verify:health-dashboard-server-only`
- `npm run verify:healthcheck-source-policy`
- `npm run verify:vault-sync-status-producer`
- `npm run verify:vault-sync-status-runner`
- `npm run verify:backup-health-status-producer`
- `npm run verify:backup-health-status-runner`
- `npm run verify:project-health-runner`
- `npm run verify:gateway-status-runner`
- `npm run verify:cronjobs-status-runner`
- `npm run verify:git-server-only`
- `npm --prefix apps/web run typecheck`
- `PYTHONPATH=. pytest apps/api/tests -q` → `129 passed`
- `npm --prefix apps/web run build` → rutas principales dinámicas, incluido `/healthcheck`.

### Runtime smoke
- FastAPI arrancó en `127.0.0.1:8011`.
- Next.js production arrancó en `127.0.0.1:3017` con `MUGIWARA_CONTROL_PANEL_API_URL=http://127.0.0.1:8011` solo server-side.
- `GET /api/v1/healthcheck` devolvió `200`, `status=ready`, `meta.read_only=true`, `meta.sanitized=true`, `meta.source=backend-owned-safe-catalog` y 6 módulos en `pass/low`.
- `/healthcheck` devolvió `200`, renderizó módulos reales (`Vault sync`, `Backups`, `Project health`, `Gateways`, `Cronjobs`) y el browser smoke no registró errores de consola.

### Timers/manifests reales
Timers user-level activos:
- `mugiwara-vault-sync-status.timer`
- `mugiwara-backup-health-status.timer`
- `mugiwara-project-health-status.timer`
- `mugiwara-gateway-status.timer`
- `mugiwara-cronjobs-status.timer`

Manifests reales validados como JSON mapping, permisos `0640` y no-leakage básico `PASS`:
- `vault-sync-status.json`: `last_success_at,result,status,updated_at`
- `backup-health-status.json`: `checksum_present,last_success_at,result,retention_count,status,updated_at`
- `project-health-status.json`: `main_branch,remote_synced,result,status,updated_at,workspace_clean`
- `gateway-status.json`: `gateways,result,status,updated_at`
- `cronjobs-status.json`: `jobs,result,status,updated_at`

### No-leakage básico
- API `/api/v1/healthcheck`: `PASS` contra backend URL, env names, `.env`, stdout/stderr, tracebacks, tokens, rutas runtime/proyecto, `state.db`, `chat_id` y `prompt_body`.
- HTML production `/healthcheck`: `PASS` contra los mismos marcadores.
- Nota operativa: el primer intento con `next dev` produjo falsos positivos de leakage por HTML/RSC de desarrollo que serializaba URL de fetch y `fileName` con rutas fuente. El criterio de readiness se ejecutó finalmente con `next build` + `next start`, no con dev server.

## Decisión
**Listo para declarar operativo privado v1**, bajo el perímetro ya definido: loopback/red privada/Tailscale, no exposición pública a internet y sin nuevas features.

## Riesgos residuales
- La declaración aplica a operación privada actual; no implica soporte internet-public ni auth/rate-limit/CSRF completos fuera del perímetro privado.
- El smoke no cubre carga, resiliencia prolongada ni performance de `/git`; esos follow-ups no son bloqueantes para v1 privada.
- No se han añadido nuevas fuentes Healthcheck ni nuevas capacidades Git; cualquier ampliación futura requiere fase explícita y review.

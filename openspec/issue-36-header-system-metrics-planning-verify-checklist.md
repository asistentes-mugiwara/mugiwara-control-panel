# Issue #36 — Planning verify checklist

## Fase
36.0 — Planning / architecture for always-visible header system metrics.

## Preflight repo/GitHub
- [x] `git status --short --branch` inicial ejecutado en `/srv/crew-core/projects/mugiwara-control-panel`.
  - Resultado: `## main...origin/main`, sin cambios locales.
- [x] `git fetch origin --prune` ejecutado.
- [x] `git switch main` ejecutado.
  - Resultado: `Already on 'main'`, rama alineada con `origin/main`.
- [x] `git pull --ff-only origin main` ejecutado.
  - Resultado: `Already up to date`.
- [x] `gh issue view 36` ejecutado.
  - Resultado: issue #36 abierto, título `Always-visible header system metrics`, label `enhancement`.
- [x] `gh pr list --state open` ejecutado.
  - Resultado: `[]`, sin PRs abiertas.
- [x] `gh issue list --state open` ejecutado.
  - Resultado: solo #36 y #40 abiertos.
- [x] Identidad Git local configurada con `/srv/crew-core/scripts/mugiwara-git-identity.sh set zoro .`.
  - Resultado: `user.name=zoro`, `user.email=asistentes.mugiwara@gmail.com`, `mugiwara.agent=zoro`, hooks Mugiwara activos.
- [x] Rama creada desde `main` actualizado.
  - Rama: `zoro/issue-36-header-system-metrics-plan`.

## Contexto consultado
- [x] `Project Summary - Mugiwara Control Panel` en vault.
  - Hallazgo: Phase 18 Healthcheck producers cerrado/canonizado por PR #83; #36/#40 son features separadas siguientes.
- [x] `docs/frontend-ui-spec.md`.
- [x] `docs/frontend-implementation-handoff.md`.
- [x] `docs/runtime-config.md`.
- [x] `docs/security-perimeter.md`.
- [x] `docs/api-modules.md`.
- [x] `docs/read-models.md`.
- [x] `docs/healthcheck-source-policy.md`.
- [x] Header/shell real en `apps/web`.
  - `apps/web/src/app/layout.tsx`.
  - `apps/web/src/shared/ui/app-shell/AppShell.tsx`.
  - `apps/web/src/shared/ui/app-shell/Topbar.tsx`.
  - `apps/web/src/shared/ui/app-shell/PageHeader.tsx`.
- [x] Adapters server-only existentes en `apps/web/src/modules/*/api/*-http.ts`.
- [x] Estructura backend real en `apps/api/src/modules` y `apps/api/src/main.py`.
- [x] Patrones de tests backend en `apps/api/tests`.
- [x] Guardrails en `package.json`.
  - `verify:health-dashboard-server-only`.
  - `verify:perimeter-policy`.
  - `verify:healthcheck-source-policy`.
  - `verify:usage-server-only`.
  - otros `verify:*server-only` existentes.
- [x] Closeout Phase 18.5.
- [x] Closeout Phase 17.4d/Usage.

## Diseño producido
- [x] Plan principal creado: `openspec/issue-36-header-system-metrics-plan.md`.
- [x] Checklist creado: `openspec/issue-36-header-system-metrics-planning-verify-checklist.md`.
- [x] Closeout de continuidad creado: `.engram/issue-36-header-system-metrics-plan-closeout.md`.
- [x] Microfases definidas:
  - 36.0 Planning / architecture.
  - 36.1 Backend read model/API foundation.
  - 36.2 Frontend server-only adapter + header integration.
  - 36.3 Guardrails, visual baseline, docs/canon and issue closeout.
- [x] Decisión inicial documentada: módulo backend específico `system`, endpoint fijo recomendado `GET /api/v1/system/metrics`.
- [x] Fronteras de seguridad documentadas: sin input cliente, sin shell/subprocess, sin paths/logs/stdout/stderr/raw host internals.
- [x] Review esperado documentado: Franky + Chopper para backend/host boundary; Usopp + Chopper para UI; Franky si hay polling/cache/runtime.

## Verify de planificación
- [x] `git diff --check` pasa.
  - Resultado: sin salida.
- [x] `git status --short --branch` confirma solo cambios documentales esperados antes de commit.
  - Resultado: tres ficheros nuevos: OpenSpec, checklist y closeout `.engram`.
- [x] Si se toca JSON/package scripts: validar sintaxis. No aplica en 36.0; no se tocaron JSON ni package scripts.
- [x] No se ha implementado backend metrics.
- [x] No se ha implementado UI final.
- [x] No se ha tocado issue #40.
- [x] No se ha cerrado issue #36.

## PR/review
- [ ] Commit creado con trailers Mugiwara.
- [ ] Rama pusheada.
- [ ] PR de planificación abierta.
- [ ] Comentario de handoff dejado en PR.
- [ ] Franky invocado para review operativa del plan host metrics.
- [ ] Chopper invocado para review de seguridad del plan host metrics.
- [ ] Respuestas/comentarios de reviewers registrados o bloqueo documentado.

## Notas
Esta fase es docs/OpenSpec/.engram-only, pero la decisión de arquitectura toca frontera host-adjacent. Por tanto, se pide review Franky + Chopper aunque no haya runtime change.

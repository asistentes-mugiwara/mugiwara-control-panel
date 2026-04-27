# Issue #36 header system metrics — planning closeout

## Fase
36.0 — Planning / architecture.

## Fecha
2026-04-27.

## Rama
`zoro/issue-36-header-system-metrics-plan`.

## Resultado
Se inició issue #36 sin implementar la feature. La fase deja plan SDD/TDD ejecutable para añadir métricas de sistema siempre visibles en el header, separando el trabajo en backend host-adjacent read model, frontend server-only/header integration y guardrails/docs/canon.

## Estado real verificado
- `main` estaba limpio y alineado con `origin/main` antes de crear rama.
- Issue #36 está abierto con label `enhancement`.
- No había PRs abiertas.
- Solo seguían abiertos #36 y #40.
- Phase 18 Healthcheck producers está cerrada/canonizada por PR #83 y no se reabre.
- Phase 17 Usage está cerrada y no se toca.

## Decisiones de planificación
- El trabajo futuro debe crear un módulo backend específico `system` para métricas de sistema, no mezclarlo en Healthcheck/Dashboard/Usage.
- Endpoint recomendado: `GET /api/v1/system/metrics`.
- El endpoint no debe aceptar input cliente; RAM/disco/uptime salen de fuentes backend-owned allowlisted.
- Disco debe usar un target explícito y revisado, inicialmente `/` salvo ajuste de Franky, sin exponer path crudo en la respuesta pública.
- Frontend debe consumir mediante adapter server-only y pasar snapshot saneada al shell/header; nunca fetch directo de navegador a backend interno ni `NEXT_PUBLIC_*` para backend URL.
- No polling agresivo por defecto; cualquier refresh automático requiere frecuencia/coste documentados y review Franky + Chopper.

## Microfases acordadas
1. **36.0 Planning / architecture** — esta fase.
2. **36.1 Backend read model/API foundation** — módulo `system`, endpoint fijo, tests de degradación/no-leakage, review Franky + Chopper.
3. **36.2 Frontend server-only adapter + header integration** — adapter server-only, shell/header global, responsive/fallback, review Usopp + Chopper.
4. **36.3 Guardrails, visual baseline, docs/canon and issue closeout** — `verify:system-metrics-server-only` o equivalente, visual/browser smoke, docs/vault, cierre #36.

## Archivos creados
- `openspec/issue-36-header-system-metrics-plan.md`.
- `openspec/issue-36-header-system-metrics-planning-verify-checklist.md`.
- `.engram/issue-36-header-system-metrics-plan-closeout.md`.

## Verify previsto/ejecutado
- Preflight GitHub/repo ejecutado antes de rama.
- Revisión dirigida de docs, shell/header, adapters, módulos backend, tests y guardrails.
- `git diff --check` debe ejecutarse antes del commit.
- No aplica build/typecheck porque la fase no toca código, package scripts ni JSON.

## Riesgos abiertos para 36.1+
- Evitar que métricas de sistema se conviertan en consola host o proxy genérico.
- Elegir y documentar target de disco con criterio operativo.
- Diseñar un fallback saneado que no oculte degradación ni rompa el header.
- Resolver la composición server/client del shell sin fetch browser ni fallback congelado en build.
- Mantener header compacto en mobile sin overflow ni ruido permanente.

## Siguiente paso recomendado
Ejecutar 36.1 como backend-only con TDD estricto: tests rojos de contrato/no-leakage/degradación, módulo `system`, endpoint fijo, verify backend/perímetro y review Franky + Chopper antes de entrar en UI.

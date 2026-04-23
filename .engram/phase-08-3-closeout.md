# Phase 8.3 closeout — dashboard + healthcheck readonly

## Resultado
- `dashboard` ya no es un placeholder simple: ahora representa un `dashboard.summary` fixture-first con contadores, severidad más alta, frescura y enlaces rápidos a módulos.
- `healthcheck` ya no es un placeholder simple: ahora representa `healthcheck.summary[]` con checks saneados, estado, severidad, frescura, warning corto y origen saneado.
- Se añadieron view-models tipados en:
  - `apps/web/src/modules/dashboard/view-models/`
  - `apps/web/src/modules/healthcheck/view-models/`
- Las páginas `app/*` siguen delgadas y read-only.
- Se documentó la microfase en `openspec/phase-8-3-dashboard-healthcheck-readonly.md` y su verify checklist.

## Verify ejecutado
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `.gitignore` sigue cubriendo `.next/` y `node_modules/` ✅
- se eliminó artefacto temporal no deseado de `openspec/changes/` ✅

## Método / runtime
- La fase se lanzó con OpenCode sobre la misma sesión SDD usada en 8.1/8.2.
- OpenCode alcanzó `explore` y dejó estrategia útil en Engram (#43), luego materializó cambios durante `apply`.
- El cierre volvió a cortarse por timeout externo, así que se auditó el repo, se verificó fuera de OpenCode y se cerró inline.

## Riesgos abiertos
- Los datos siguen siendo fixtures frontend, no lecturas reales del backend.
- Aún no existe data layer compartida ni contratos consumidos desde API.
- El resto de superficies (`mugiwaras`, `memory`, `vault`) siguen en placeholder fino.

## Siguiente microfase recomendada
- `phase-8-4-web-memory-vault-readonly`

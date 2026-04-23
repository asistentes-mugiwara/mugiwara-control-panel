# Phase 8.4 closeout — memory + vault readonly

## Resultado
- `memory` ya no es un placeholder simple: ahora representa `memory.agent_summary[]` con resúmenes por Mugiwara, facts visibles, badges y última actualización.
- `vault` ya no es un placeholder simple: ahora representa `vault.index` con breadcrumbs, frescura visible e índice allowlisted navegable dentro de la misma página.
- Se añadieron fixtures tipadas en:
  - `apps/web/src/modules/memory/view-models/memory-agent-summary.fixture.ts`
  - `apps/web/src/modules/vault/view-models/vault-index.fixture.ts`
- Las páginas `app/*` siguen delgadas y read-only.
- La separación entre `memory` y `vault` sigue explícita tanto en datos como en copy de interfaz.

## Verify ejecutado
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- sin backend real, sin fetch y sin rutas detalle nuevas ✅
- `.gitignore` sigue cubriendo artefactos frontend ✅

## Método / runtime
- La microfase se lanzó en la misma sesión SDD de trabajo.
- El primer intento headless no dejó progreso observable.
- En el reintento, OpenCode rescató la microfase inline dentro de la sesión, materializó los cambios y ejecutó verify real (`typecheck` + `build`).
- Se cierra fuera de OpenCode con trazabilidad documental y Engram para mantener el método limpio.

## Riesgos abiertos
- Los datos siguen siendo fixtures frontend, no lecturas reales del backend.
- `memory/[slug]` y `vault/[...path]` siguen fuera de alcance.
- `mugiwaras` continúa pendiente como siguiente superficie read-only.

## Siguiente microfase recomendada
- `phase-8-5-mugiwaras-readonly`

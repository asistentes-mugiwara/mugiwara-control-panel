# Phase 9.6 closeout — vault editorial workspace

## Resultado
- `/vault` pasa de índice read-only plano a workspace documental con tres zonas: árbol allowlisted, documento activo y panel de metadatos.
- Se añadió `apps/web/src/modules/vault/view-models/vault-workspace.fixture.ts` con:
  - árbol navegable
  - documentos allowlisted
  - breadcrumbs por documento
  - TOC y metadatos editoriales
- La página `apps/web/src/app/vault/page.tsx` ahora muestra:
  - callout de canon curado
  - selección local de documento
  - documento legible con secciones y párrafos
  - panel lateral de metadatos y TOC
- La experiencia deja explícita la diferencia entre `vault` documental y `memory` operativa.

## Verify ejecutado
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `git diff --check` ✅

## Riesgos abiertos
- la fase sigue apoyándose en fixtures; no hay backend real de vault.
- la navegación es local en página, no por ruta `/vault/[...path]` todavía.
- no hay render markdown real; el documento se representa como estructura editorial saneada.

## Siguiente paso recomendado
- 9.7 — Healthcheck con summary bar, grid de módulos y tabla/lista de eventos.

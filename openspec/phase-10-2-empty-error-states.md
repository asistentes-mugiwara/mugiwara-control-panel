# Phase 10.2 — empty and error states

## Scope
Homogeneizar los estados vacíos, de incidencia, stale y fuente no configurada en las superficies principales del frontend sin abrir backend nuevo ni ampliar el perímetro editable.

## Decisions
- Se introduce un componente compartido `StatePanel` para expresar estados explícitos con badge, título, descripción y detalle opcional.
- `skills` deja de depender de párrafos sueltos para `loading`, `not_configured`, `empty`, `error`, preview no disponible y ausencia de auditoría.
- `memory` hace visible cuándo una fuente está `stale`, `error` o `unavailable`, y cubre vacíos de badges/facts sin dejar huecos mudos.
- `vault` añade tratamiento explícito para índice vacío, ausencia de documento activo, documento sin secciones, TOC vacío y frescura degradada.
- `healthcheck` resume incidencias agregadas y contempla vacíos de eventos o señales como estados legítimos de la UI.
- No se introducen dependencias nuevas ni cambios de producto fuera del refinamiento de estados transversales.

## Definition of done
- existe un patrón visual compartido para estados vacíos y de error.
- `skills` expresa claramente `not_configured`, `empty`, `error` y preview/auditoría vacíos.
- `memory`, `vault` y `healthcheck` muestran estados explícitos en vez de paneles silenciosos cuando faltan datos o la frescura cae.
- el shell y el build siguen estables sin tocar la frontera editable del MVP.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

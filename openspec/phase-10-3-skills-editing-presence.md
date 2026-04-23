# Phase 10.3 — skills editing presence

## Scope
Reforzar que `skills` se perciba como la única superficie editable del MVP y no como una pantalla de lectura más.

## Decisions
- Se mantiene `skills` como única frontera de escritura del MVP.
- La UI debe comunicar explícitamente el modo de trabajo: edición controlada vs referencia read-only.
- Se añade un workspace superior que resume actor visible, estado del borrador, preview y guardado.
- El catálogo real distingue mejor las skills editables con acento visual y copy específico de acción.
- El panel principal pasa a sentirse como editor allowlisted: modo activo, borrador, acciones y delta visible.
- No se abre nueva escritura fuera de la allowlist existente ni se añaden dependencias nuevas.

## Definition of done
- `skills` ya no parece una ficha documental genérica.
- una skill editable se distingue visual y verbalmente de una skill de referencia.
- el usuario entiende el flujo productivo: editar → preview → guardar.
- el estado de actor, borrador y guardado queda visible sin leer el código.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

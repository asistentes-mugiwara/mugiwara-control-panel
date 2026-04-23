# Phase 8.6 — skills read-only + edit boundary

## Scope
Convertir `skills` en una superficie frontend útil sin abrir todavía escritura real: lectura saneada de skills representativas y frontera explícita de edición permitida.

## Decisions
- `skills` sigue siendo la única superficie potencialmente editable del MVP, pero en esta microfase la UI permanece read-only.
- La allowlist editable sigue siendo responsabilidad exclusiva de backend.
- El frontend no resuelve paths libres ni construye operaciones de guardado.
- La vista debe mostrar frontera deny-by-default, auditoría mínima exigida y ejemplos de exposición por skill.
- Las skills fuera de allowlist editable se representan como referencia read-only.

## Definition of done
- `skills` deja de ser placeholder simple.
- existe un view-model tipado para representar frontera, auditoría mínima y cards de skills.
- la página comunica con claridad qué puede editarse en el futuro y qué permanece read-only.
- no se añaden formularios, fetch, rutas detalle ni escritura real.
- verify real (`typecheck` + `build`) pasa.

## Verify expected
- coherencia con la política de MVP casi read-only.
- ausencia de edición libre por path.
- auditoría mínima visible antes de cualquier futura escritura.
- no aparecen nuevas rutas detalle ni integración backend real.

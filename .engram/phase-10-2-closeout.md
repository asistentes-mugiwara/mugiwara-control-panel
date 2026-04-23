# Phase 10.2 closeout — empty and error states

## Resultado
- Se añade `apps/web/src/shared/ui/state/StatePanel.tsx` como patrón visual compartido para estados explícitos.
- `skills` pasa a expresar con el mismo patrón los estados `loading`, `not_configured`, `empty`, `error`, preview no disponible y ausencia de auditoría resumida.
- `memory` muestra avisos operativos cuando una fuente está `stale`, `error` o `unavailable`, y cubre vacíos de badges/facts.
- `vault` deja cubiertos índice vacío, documento ausente, documento sin secciones, TOC vacío y frescura degradada.
- `healthcheck` añade un resumen agregado de incidencias/advertencias y estados vacíos para eventos y señales.

## Learnings
- En esta UI MVP, los vacíos y fallos deben sentirse como estados de producto deliberados, no como huecos silenciosos.
- Un componente compartido reduce drift visual y evita que cada vista improvise mensajes distintos para el mismo tipo de ausencia.
- `skills` sigue siendo la única frontera editable; el refinamiento transversal puede crecer sin abrir escritura adicional.

## Verify ejecutado
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `git diff --check` ✅

## Riesgos abiertos
- no hay aún harness visual/e2e que asegure automáticamente el rendering de cada combinación de estado.
- algunos estados siguen apoyándose en fixtures; el backend real deberá mapearse a este patrón sin drift cuando se conecten más superficies.

## Siguiente paso recomendado
- cerrar verify real y, si queda limpio, seguir con el siguiente refinamiento visual o de accesibilidad del bloque 10.x.

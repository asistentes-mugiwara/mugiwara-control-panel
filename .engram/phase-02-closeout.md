# Phase 02 closeout

- phase: 02
- title: backend frontier design
- status: closed
- project: mugiwara-control-panel

## Qué se cerró
- Se diseñó `apps/api` como frontera deny-by-default del MVP.
- Se delimitaron los módulos backend del control plane.
- Se documentaron allowlists iniciales de lectura/escritura y checklist de verify.

## Decisiones importantes
- `skills` sigue siendo la única superficie editable en MVP.
- `vault` mantiene módulo propio.
- `memory` cubre built-in y Honcho resumido; Engram queda por proyecto en una fase posterior.
- El backend no debe exponer acceso arbitrario al host.

## Incidencia de método
- OpenCode arrancó desde la raíz correcta, pero la fase SDD no cerró de forma fiable dentro del timeout externo durante `sdd-init-zoro`.
- Se aplicó la regla de recuperación: reintento una vez y cierre inline de la fase documental.

## Siguiente fase sugerida
- Diseñar el shell frontend (`apps/web`) como superficie de lectura y navegación alineada con esta frontera backend.

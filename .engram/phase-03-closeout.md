# Phase 03 closeout

- phase: 03
- title: frontend shell design
- status: closed
- project: mugiwara-control-panel

## Qué se cerró
- Se definió el shell frontend del MVP.
- Se fijó la navegación principal del control plane.
- Se documentaron módulos frontend y estados de UI por recurso.

## Decisiones importantes
- `apps/web` se organiza en `app`, `modules` y `shared`.
- Solo `skills` mantiene edición prevista en MVP.
- Los estados operativos deben incluir `stale` cuando haya frescura temporal.
- El cliente no debe asumir seguridad ni acceso al host.

## Incidencia de método
- Se confirmó que prompts complejos inline con backticks pueden contaminar la invocación shell antes de llegar a OpenCode.
- Se definió como solución usar fichero temporal + `$(cat fichero)` o TUI/sesión explícita.

## Siguiente fase sugerida
- Diseñar contratos compartidos (`packages/contracts`) entre backend y frontend para recursos del MVP.

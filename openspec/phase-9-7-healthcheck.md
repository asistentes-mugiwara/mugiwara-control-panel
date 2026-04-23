# Phase 9.7 — healthcheck summary + modules + events

## Scope
Cerrar la superficie de `healthcheck` del MVP con una vista más operativa: summary bar, grid de módulos, eventos recientes y contexto de perímetro de seguridad.

## Decisions
- `healthcheck` sigue siendo read-only y fixture-driven en esta fase.
- La UI se estructura en cuatro bloques: summary bar, grid de módulos, eventos recientes y señales/principios de seguridad.
- Los datos siguen saneados; no se expone metadata sensible del host ni salidas crudas.
- `SystemSignalsPanel` e `IncidentsPanel` se resuelven como bloques equivalentes de señales y eventos recientes para mantener claridad.
- Se intentó arrancar SDD en OpenCode, pero `sdd-init` volvió a agotarse por timeout externo; la fase se rescató inline sin ampliar scope.

## Definition of done
- existe summary bar con estado general y contadores.
- existe grid de módulos con resumen por componente.
- existe lista de eventos recientes.
- existe bloque de principios de seguridad o perímetro.
- la pantalla sigue siendo sobria, operativa y saneada.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

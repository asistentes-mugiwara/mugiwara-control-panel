# Phase 2 — backend frontier design

## Scope
Diseñar la frontera backend del proyecto como superficie deny-by-default para todos los recursos del MVP.

## Decisions
- `apps/api` será la única frontera autorizada para acceder a datos locales.
- Los recursos del MVP quedan separados en módulos: `skills`, `mugiwaras`, `memory`, `vault`, `healthcheck`, `system`.
- Solo `skills` tendrá capacidad de escritura en el MVP.
- `memory` no mezcla vault ni engram; built-in y Honcho resumido quedan en el módulo `memory`, mientras que vault mantiene módulo propio.
- El backend debe aplicar allowlists explícitas por recurso y por capacidad.

## Definition of done
- política deny-by-default documentada
- módulos backend identificados y delimitados
- allowlists iniciales de lectura/escritura documentadas
- checklist de verify y riesgos de la fase escritos
- worktree coherente y listo para revisión

## Verify expected
- revisión de coherencia entre `AGENTS.md`, `docs/backend-boundary.md`, `docs/api-modules.md` y esta spec
- comprobación de que no se ha introducido escritura fuera de `skills`
- comprobación de que el repo sigue limpio de artefactos sensibles

## Judgment-day trigger
Lanzar `judgment-day` si en una fase posterior esta frontera documental se convierte en implementación ejecutable con:
- acceso a filesystem real
- escritura efectiva
- saneado de datos sensibles
- lectura de salud del host o cron con detalle operativo

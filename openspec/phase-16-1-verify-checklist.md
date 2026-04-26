# Phase 16.1 verify checklist — Healthcheck triage UI (#44)

## Scope guard
- [x] Cambio limitado a frontend UI/view-model + docs.
- [x] Sin backend/API/read-model expansion.
- [x] Sin host reads, comandos, controles operativos ni remediación.

## UX acceptance
- [x] Módulos ordenados por prioridad `fail/high/critical` > `stale/warn/medium` > `pass/low`.
- [x] Bloque `Acción requerida` muestra la prioridad actual cuando hay degradación.
- [x] Badges de estado/severidad no se duplican si tienen el mismo significado visual.
- [x] Checks sanos `pass/low` quedan calmados sin desaparecer.

## Verify ejecutado
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] `npm run verify:visual-baseline`
- [x] `git diff --check`
- [x] Smoke visual local `/healthcheck` con browser y consola sin errores JS.

## Review esperado
- Usopp: UI/UX hierarchy y claridad de respuesta.
- Chopper/Franky: no requeridos salvo que el reviewer detecte cambio semántico o perímetro operativo.

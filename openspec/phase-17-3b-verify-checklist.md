# Phase 17.3b verify checklist

## Scope decision
- [x] 17.3b se limita a UI calendario en `/usage`.
- [x] No añade backend, fuentes nuevas, escritura, Hermes activity ni ventanas históricas dedicadas.
- [x] Consume solo `current_cycle` desde el endpoint allowlisted ya cerrado en 17.3a.

## TDD / guardrail
- [x] Red inicial: `npm run verify:usage-server-only` falló al exigir adapter calendario, contratos compartidos y grid responsive todavía inexistentes.
- [x] Adapter server-only actualizado con `UsageCalendarRange`/`UsageCalendarResponse`.
- [x] Página `/usage` renderiza calendario por fecha natural Europe/Madrid.
- [x] Fallback local saneado incluye fixture calendario sin datos sensibles.
- [x] `verify:usage-server-only` fija ausencia de proxy genérico, env pública y lectura directa de env en página.

## UI / UX
- [x] Cards calendario apilables sin tabla ni scroll horizontal obligatorio.
- [x] Día muestra delta de ciclo, ventanas 5h, pico 5h y estado.
- [x] Tramos parciales explican inicio/reset del ciclo semanal Codex.
- [x] Copy mantiene fuera de alcance actividad Hermes y ventanas históricas dedicadas.
- [x] Visual baseline actualizada.

## Verify evidence
- [x] `npm run verify:usage-server-only`.
- [x] `npm --prefix apps/web run typecheck`.
- [x] `npm --prefix apps/web run build`.
- [x] `npm run verify:visual-baseline`.
- [x] `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q`.
- [x] `git diff --check`.
- [x] Smoke browser `/usage` sin consola roja ni overflow horizontal obvio en viewport desktop disponible.

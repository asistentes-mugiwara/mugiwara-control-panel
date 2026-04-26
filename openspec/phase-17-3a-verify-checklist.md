# Phase 17.3a verify checklist

## Scope decision
- [x] 17.3 se divide en 17.3a backend read model y 17.3b UI calendario.
- [x] 17.3a no añade UI, Hermes activity, endpoint de ventanas históricas ni escritura.
- [x] `range` queda allowlisted (`current_cycle`, `previous_cycle`, `7d`, `30d`).

## Implementation checklist
- [x] `GET /api/v1/usage/calendar` añadido.
- [x] Calendario agrupa por fecha natural en `Europe/Madrid`.
- [x] Tramo parcial se marca para inicio/reset del ciclo semanal Codex.
- [x] Deltas diarios, conteo de ventanas 5h y pico 5h calculados desde snapshots saneados.
- [x] Rechazo de rangos inválidos no ecoa input sensible.
- [x] Contrato TS `UsageCalendarResponse` añadido.
- [x] Docs vivas actualizadas.

## Verify evidence
- [x] Red TDD inicial: `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` falló por endpoint `/calendar` inexistente.
- [x] `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q`.
- [x] `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py`.
- [x] `npm --prefix apps/web run typecheck`.
- [x] `git diff --check`.
- [x] Smoke API real/TestClient dirigido de `/api/v1/usage/calendar?range=current_cycle` contra la SQLite runtime saneada.

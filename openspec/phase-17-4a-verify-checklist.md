# Phase 17.4a verify checklist

## Scope decision
- [x] 17.4 se divide antes de implementar.
- [x] 17.4a se limita a backend five-hour windows.
- [x] UI `/usage` y Hermes activity quedan fuera.

## Backend contract
- [x] Endpoint fijo `GET /api/v1/usage/five-hour-windows`.
- [x] `limit` validado entre 1 y 24.
- [x] Fuente única SQLite allowlisted en `mode=ro`.
- [x] Ventanas agrupadas por `primary_window_start_at`/`primary_reset_at`.
- [x] Salida saneada sin path runtime, raw payload, prompts ni actividad Hermes.
- [x] DB ausente degrada a `not_configured` content-free.
- [x] Contrato TS compartido actualizado.

## Verify evidence
- [x] Red inicial: tests nuevos fallaban con `404` antes de implementar el endpoint.
- [x] `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` → 8 passed.
- [x] `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py`.
- [x] `npm --prefix apps/web run typecheck`.
- [x] `git diff --check`.
- [x] Smoke TestClient contra SQLite real: `GET /api/v1/usage/five-hour-windows?limit=3` → 200 `ready`, 3 ventanas, sin path runtime.

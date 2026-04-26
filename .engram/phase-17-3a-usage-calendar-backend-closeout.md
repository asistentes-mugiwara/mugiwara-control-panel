# Phase 17.3a — Usage calendar backend closeout

## Decisión
17.3 se divide en 17.3a backend calendar read model y 17.3b UI calendario. Esta subfase cierra solo la frontera backend/contrato.

## Cerrado
- Endpoint `GET /api/v1/usage/calendar` con `range` allowlisted.
- Agregación por fecha natural `Europe/Madrid`.
- `days[]` con tramo Codex, delta diario del ciclo semanal Codex, conteo de ventanas 5h, pico diario 5h y estado diario saneado.
- Tipos TS compartidos `UsageCalendar*`.
- Docs `api-modules` y `read-models` actualizadas.

## Fuera de alcance preservado
- UI calendario en `/usage` queda para 17.3b.
- Actividad Hermes agregada y perfil dominante siguen fuera hasta 17.4.
- Endpoint dedicado de ventanas 5h históricas sigue separado.

## Seguridad
- No se añade escritura.
- No hay path/url/method recibido como parámetro.
- Rango inválido devuelve `validation_error` saneado por FastAPI handler.
- No se exponen paths runtime, raw payload, prompts, user/account IDs, tokens ni logs.

## Verify
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` (6 tests; incluye regresión de reset/cambio de ciclo en la misma fecha natural).
- `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py`.
- `npm --prefix apps/web run typecheck`.
- `git diff --check`.
- Smoke API real/TestClient de `/api/v1/usage/calendar?range=current_cycle` contra SQLite runtime saneada.

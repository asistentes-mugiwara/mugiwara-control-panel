# Phase 17.1 closeout — Usage backend current snapshot foundation

## Resultado
Phase 17.1 arranca el bloque Usage (#51) por la parte más segura: backend read-only de snapshot actual.

## Cambios técnicos
- Añadido módulo `apps/api/src/modules/usage` con `UsageService` y router.
- Registrado `GET /api/v1/usage/current` en FastAPI.
- Añadidos tests `apps/api/tests/test_usage_api.py`.
- Añadido `AGENTS.md` del módulo Usage con frontera de seguridad.
- Añadidos OpenSpec de Phase 17.0 y Phase 17.1.
- Actualizadas docs vivas `docs/api-modules.md` y `docs/read-models.md`.

## Decisiones relevantes
- Primera entrega limitada a snapshot actual; no mezcla UI, calendario ni actividad Hermes local.
- Fuente runtime fija y read-only; no discovery, shell ni escritura.
- `stale` para snapshots mayores de 45 minutos.
- La respuesta contiene copy de privacidad pero no valores sensibles ni path runtime.
- Tras revisión operativa de Franky, el router calcula el payload una sola vez por request y deriva el status del mismo payload para evitar doble lectura SQLite.

## Verify
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py apps/api/tests/test_shared_contracts.py -q` → 5 passed.
- `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py apps/api/tests/test_vault_api.py apps/api/tests/test_healthcheck_dashboard_api.py apps/api/tests/test_usage_api.py -q` → 72 passed.
- `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py` → OK.
- `git diff --check` → OK.

## Continuidad
Siguiente microfase recomendada: 17.2, ruta `/usage` y UI current-state con loader server-only, fallback visible, navegación `Uso` y review Usopp + Chopper/Franky si se mantiene la fuente real.

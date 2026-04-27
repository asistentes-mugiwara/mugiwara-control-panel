# Phase 17.4c verify checklist — Usage Hermes activity backend

## Red first
- [x] Tests nuevos añadidos antes del endpoint y del constructor `hermes_profiles_root`.
- [x] Red inicial confirmado: `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` falló con `UsageService.__init__() got an unexpected keyword argument 'hermes_profiles_root'`.

## Backend contract
- [x] Endpoint fijo `GET /api/v1/usage/hermes-activity`.
- [x] Rango tipado/allowlisted: `current_cycle`, `previous_cycle`, `7d`, `30d`.
- [x] Fuente Hermes detrás de env server-only `MUGIWARA_HERMES_PROFILES_ROOT`.
- [x] Perfiles Mugiwara allowlisted explícitamente.
- [x] SQLite abierto en `mode=ro`.
- [x] No se seleccionan campos sensibles de `sessions` (`user_id`, prompts, model config, tokens, costes, billing URL, title).
- [x] Payload sin ruta de perfiles ni `state.db` path.

## Verify ejecutado
- [x] `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py`
- [x] `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` → 12 passed.
- [x] `npm run verify:usage-server-only` → passed.
- [x] `npm --prefix apps/web run typecheck` → passed.
- [x] `npm --prefix apps/web run build` → passed, `/usage` sigue dinámica (`ƒ`).
- [x] `git diff --check` → passed.
- [x] Smoke TestClient con `MUGIWARA_HERMES_PROFILES_ROOT` configurado localmente → `ready`, agregados por perfil, sin path ni marcadores sensibles.

## Pendiente antes de PR
- [x] Completar verify final.
- [x] Actualizar closeout `.engram/` y docs.
- [ ] PR con handoff Franky + Chopper.

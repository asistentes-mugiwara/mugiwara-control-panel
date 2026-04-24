# Phase 12.5 verify checklist — Healthcheck and Dashboard aggregation APIs

## Backend
- [x] `healthcheck` backend module added under `apps/api/src/modules/healthcheck`.
- [x] `dashboard` backend module added under `apps/api/src/modules/dashboard`.
- [x] Endpoints registered in FastAPI app.
- [x] Tests cover normal, stale and unavailable/not-configured states.
- [x] Tests reject sensitive host output patterns in payloads.

## Frontend
- [x] `/healthcheck` reads via server-only adapter and remains dynamic.
- [x] `/dashboard` reads via server-only adapter and remains dynamic.
- [x] Both pages keep sane fallback and visible API-state notices.
- [x] Static guardrail blocks public env regression and generic browser-side backend config usage.

## Verify evidence
- [x] `python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/src/modules/healthcheck/router.py apps/api/src/modules/dashboard/service.py apps/api/src/modules/dashboard/router.py`.
- [x] `PYTHONPATH=. pytest apps/api/tests/test_healthcheck_dashboard_api.py` → 5 passed.
- [x] `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py apps/api/tests/test_vault_api.py apps/api/tests/test_healthcheck_dashboard_api.py` → 27 passed.
- [x] `npm run verify:health-dashboard-server-only` → passed.
- [x] `npm --prefix apps/web run typecheck` → passed.
- [x] `npm --prefix apps/web run build` → passed; `/dashboard` and `/healthcheck` are dynamic (`ƒ`).

## Pending before merge
- [x] API + web smoke with local backend configured:
  - `GET http://127.0.0.1:8001/api/v1/healthcheck` → 200.
  - `GET http://127.0.0.1:8001/api/v1/dashboard` → 200.
  - Browser smoke `http://127.0.0.1:3002/healthcheck` → 200, backend-backed Healthcheck content visible, no console errors.
  - Browser smoke `http://127.0.0.1:3002/dashboard` → 200, backend-backed Dashboard content visible, no console errors.
- [ ] PR review by Franky + Chopper.

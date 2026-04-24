# Phase 12.5 closeout — Healthcheck and Dashboard aggregation APIs

## Goal
Move `/healthcheck` and `/dashboard` from frontend-only fixtures to backend-owned read-only summaries without opening host-control or shell surfaces.

## Completed
- Added backend `healthcheck` module and tests.
- Added backend `dashboard` aggregation module and tests.
- Added `GET /api/v1/healthcheck` and `GET /api/v1/dashboard`.
- Added server-only frontend adapters for Healthcheck and Dashboard.
- Converted `/healthcheck` and `/dashboard` to dynamic server pages that fetch backend data and fall back to sane local fixtures with visible API-state notices.
- Added `npm run verify:health-dashboard-server-only` guardrail.
- Added OpenSpec artifact and verify checklist.

## Security notes
- No shell commands, Docker/systemd control, logs, stdout/stderr, host paths or secrets are read or exposed.
- Healthcheck uses a backend-owned safe catalog for this phase.
- Dashboard aggregates only safe summaries and allowlisted links.
- Unavailable Healthcheck is explicit (`not_configured`/stale warning) rather than silently treated as healthy.
- Frontend uses private `MUGIWARA_CONTROL_PANEL_API_URL`; no `NEXT_PUBLIC_*` backend URL is introduced.

## Verify snapshot
- `python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/src/modules/healthcheck/router.py apps/api/src/modules/dashboard/service.py apps/api/src/modules/dashboard/router.py` OK.
- `PYTHONPATH=. pytest apps/api/tests/test_healthcheck_dashboard_api.py` → 5 passed.
- `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py apps/api/tests/test_vault_api.py apps/api/tests/test_healthcheck_dashboard_api.py` → 27 passed.
- `npm run verify:health-dashboard-server-only` OK.
- `npm --prefix apps/web run typecheck` OK.
- `npm --prefix apps/web run build` OK with `/dashboard` and `/healthcheck` dynamic.
- API smoke on local Phase 12.5 backend (`127.0.0.1:8001`): `/api/v1/healthcheck` 200 and `/api/v1/dashboard` 200.
- Browser smoke on local web (`127.0.0.1:3002` with backend configured): `/healthcheck` 200 and `/dashboard` 200, backend-backed content visible, console clean.

## Review expectation
- Franky: runtime/server-only/dynamic behaviour and aggregation semantics.
- Chopper: healthcheck/host-output safety boundary and sanitized error/fallback behaviour.

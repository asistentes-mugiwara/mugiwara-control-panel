# Phase 17.4a closeout — Usage five-hour windows backend

## Scope
17.4 was split before implementation. 17.4a adds only the backend read model for dedicated Codex five-hour windows.

## Implemented
- `GET /api/v1/usage/five-hour-windows?limit=8`.
- SQLite read-only source remains the allowlisted Codex usage DB.
- Windows are grouped by `primary_window_start_at`/`primary_reset_at`.
- Public payload exposes only start/end, peak %, positive delta %, sample count and status.
- Missing/unreadable/no usable snapshots degrade to `not_configured` without paths.
- Shared TS contracts and docs updated.

## Deferred
- 17.4b: `/usage` UI for windows.
- 17.4c: Hermes activity aggregation, with separate source/security review.
- 17.4d: UI Hermes activity + final #51 closeout/canon.

## Verify
- Red inicial: tests nuevos fallaron con 404 antes de implementar el endpoint.
- `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py`.
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` → 8 passed.
- `npm --prefix apps/web run typecheck`.
- `git diff --check`.
- Smoke TestClient contra SQLite real: `GET /api/v1/usage/five-hour-windows?limit=3` → 200 `ready`, 3 ventanas, sin path runtime.

## Discovery
Real SQLite snapshots showed 1-second jitter in `primary_window_start_at`/`primary_reset_at`; the endpoint normalizes window start/end to UTC minute buckets so one physical Codex window is not split into duplicate rows.

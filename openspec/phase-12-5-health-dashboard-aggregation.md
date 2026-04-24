# Phase 12.5 — Healthcheck and Dashboard aggregation APIs

## Scope
Backend-own the read-only Healthcheck workspace and Dashboard aggregation before Phase 12 closeout.

## Implemented
- Backend `healthcheck` module:
  - `GET /api/v1/healthcheck` returns sanitized summary bar, module cards, events, principles and signals.
  - Uses backend-owned safe catalog only; no shell, Docker, systemd, log, stdout/stderr or host path reads.
  - Supports explicit `not_configured` state when no safe records exist.
- Backend `dashboard` module:
  - `GET /api/v1/dashboard` aggregates safe Healthcheck output plus allowlisted product links/counts.
  - Makes unavailable Healthcheck state visible as stale/warning instead of hiding it.
- Frontend server-only integration:
  - `/healthcheck` uses `apps/web/src/modules/healthcheck/api/healthcheck-http.ts` with `server-only`, private `MUGIWARA_CONTROL_PANEL_API_URL`, `cache: 'no-store'` and dynamic rendering.
  - `/dashboard` uses `apps/web/src/modules/dashboard/api/dashboard-http.ts` with the same server-only boundary.
  - Both routes keep sane local fallback and now show an API-state notice when falling back.
- Added static guardrail `npm run verify:health-dashboard-server-only`.

## Security boundary
- Read-only only.
- No live host internals are read in this phase.
- No arbitrary path, URL, command or method is accepted from the browser.
- API payloads are backend-owned fixtures/summaries and are sanitized by construction.
- Frontend adapters do not expose backend URL through `NEXT_PUBLIC_*`.

## Verify expected
```bash
python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/src/modules/healthcheck/router.py apps/api/src/modules/dashboard/service.py apps/api/src/modules/dashboard/router.py
PYTHONPATH=. pytest apps/api/tests/test_healthcheck_dashboard_api.py
PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py apps/api/tests/test_vault_api.py apps/api/tests/test_healthcheck_dashboard_api.py
npm run verify:health-dashboard-server-only
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
```

## Review routing
- Franky required: runtime/server-only frontend loading, health/dashboard aggregation and operational semantics.
- Chopper required: healthcheck safety boundary, no shell/host output exposure and sanitized fallback behavior.
- Usopp only if visual layout changes materially; this phase preserves layout and adds fallback notices.

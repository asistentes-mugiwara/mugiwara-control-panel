# Phase 14.1 verify checklist — Healthcheck/Dashboard source-hardening foundation

## Scope gate
- [x] Work stays backend-only.
- [x] No live host source connector added.
- [x] No shell/Docker/systemd/log/stdout/stderr/arbitrary filesystem read added.
- [x] No frontend visible/UI change.

## Tests
- [x] Added test for offset-aware timestamp parsing where lexical order is wrong.
- [x] Added test proving invalid timestamp strings do not win freshness aggregation.
- [x] Added test proving naive ISO timestamps are normalized before comparison with offset-aware timestamps.
- [x] Added test proving Dashboard honors `severity == 'critical'` from sanitized Healthcheck records.
- [x] Existing Healthcheck/Dashboard sanitized-output tests still pass.

## Verify commands
- [x] `python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/src/modules/healthcheck/router.py apps/api/src/modules/dashboard/service.py apps/api/src/modules/dashboard/router.py apps/api/tests/test_healthcheck_dashboard_api.py` — passed.
- [x] `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` — `9 passed`.
- [x] `PYTHONPATH=. python -m pytest apps/api/tests -q` — `34 passed`.
- [x] `npm run verify:health-dashboard-server-only` — passed.
- [x] `npm run verify:perimeter-policy` — passed.
- [x] `npm --prefix apps/web run typecheck` — passed.
- [x] `npm --prefix apps/web run build` — passed; `/dashboard` and `/healthcheck` remain dynamic (`ƒ`).
- [x] `git diff --check` — passed.

## Documentation
- [x] OpenSpec records implemented hardening and deferred host/source scope.
- [x] Runtime/perimeter docs updated to reflect Phase 14.1 foundation and deferred host/source scope.
- [x] `.engram` closeout completed with final verification evidence.

## Issue #16 status decision
- [ ] Add GitHub issue comment after PR/review outcome: this microphase closes timestamp parsing + critical severity aggregation foundation; real source connectors/backend host allowlist remain future work unless Pablo decides issue #16 can close as foundation-only.

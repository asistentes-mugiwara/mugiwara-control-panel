# Phase 14.1 closeout — Healthcheck/Dashboard source-hardening foundation

## Status
In progress on branch `zoro/phase-14-1-health-dashboard-real-source-hardening`.

## Summary
This microphase starts issue #16 after the Phase 13 perimeter closeout by hardening existing backend-owned sanitized Healthcheck/Dashboard aggregation before any real host source is connected.

Implemented:
- Healthcheck latest-update selection now parses timestamps explicitly instead of using lexical string ordering.
- Healthcheck parses `Z`, offset-aware and naive ISO timestamps explicitly, normalizing naive values to UTC for safe comparison, and ignores invalid timestamps for freshness winner selection.
- Dashboard highest severity now uses sanitized Healthcheck record severity, so `critical` can win even if the status is not `fail`.
- Dashboard critical incident count now counts records with `severity == 'critical'`.

## Security boundary
No new real source, host connector, shell execution, Docker/systemd access, log read, stdout/stderr exposure, arbitrary filesystem read, browser input or write surface was added.

## Verification evidence
- TDD red run before implementation: `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` failed on timestamp freshness and critical severity expectations.
- `python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/src/modules/healthcheck/router.py apps/api/src/modules/dashboard/service.py apps/api/src/modules/dashboard/router.py apps/api/tests/test_healthcheck_dashboard_api.py` — passed.
- `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` — `9 passed`.
- `PYTHONPATH=. python -m pytest apps/api/tests -q` — `34 passed`.
- `npm run verify:health-dashboard-server-only` — passed.
- `npm run verify:perimeter-policy` — passed after updating the perimeter guardrail to assert the new Phase 14.1 #16 relationship text.
- `npm --prefix apps/web run typecheck` — passed.
- `npm --prefix apps/web run build` — passed; `/dashboard` and `/healthcheck` remain dynamic (`ƒ`).
- `git diff --check` — passed.

## Remaining scope for issue #16
- Real audited health sources remain future work.
- Backend host allowlist enforcement remains deferred until a concrete deployment/source topology requires it.
- After PR review, comment on issue #16 with the exact closed slice and residual scope.

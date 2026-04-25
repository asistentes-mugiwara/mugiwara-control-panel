# Phase 14.1 — Healthcheck/Dashboard source-hardening foundation for issue #16

## Objective
Address the first implementation slice of GitHub issue #16 after the Phase 13 perimeter block: make Healthcheck freshness aggregation parse timestamps explicitly and make Dashboard aggregation honor real Healthcheck record severity, including `critical`, without connecting live host sources yet.

## Why now
Phase 13.5 closed the private-control-plane perimeter block and explicitly cleared issue #16 as the next separate track. The safest first microphase is to harden existing backend-owned sanitized records before adding audited real sources.

## Scope
- Backend `HealthcheckService` freshness aggregation.
- Backend `DashboardService` highest-severity and critical-count aggregation.
- Tests proving offset-aware timestamp comparison and `critical` severity behavior.
- Documentation/closeout for what remains intentionally deferred.

## Out of scope
- No new live host sources.
- No shell, Docker, systemd, log, stdout/stderr or arbitrary filesystem reads.
- No browser/client input, generic proxy, path/URL selector or write surface.
- No backend host allowlist enforcement yet; the current topology still uses server-only `MUGIWARA_CONTROL_PANEL_API_URL` under the Phase 13 private perimeter.
- No frontend visual/layout change.

## Implemented behavior
1. Healthcheck latest-update aggregation no longer uses lexical `max()` over timestamp strings.
2. Healthcheck parses ISO timestamps explicitly, including `Z`, offset-aware and naive ISO timestamps; naive values are normalized to UTC for safe comparison and invalid timestamps are ignored for freshness winner selection.
3. Dashboard highest severity now prioritizes the sanitized Healthcheck record `severity` field before falling back to status-derived severity.
4. Dashboard critical incident count now counts modules with `severity == 'critical'` instead of treating every `fail` status as a critical incident.

## Definition of done
- Tests cover offset-aware timestamp freshness selection.
- Tests cover invalid and naive timestamp strings not breaking or winning freshness aggregation incorrectly.
- Tests cover `critical` record severity winning Dashboard highest-severity aggregation.
- Existing sanitized-output tests still pass.
- Docs clearly state that real-source connectors and backend host allowlist enforcement remain separate future work.

## Verify expected
```bash
python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/src/modules/healthcheck/router.py apps/api/src/modules/dashboard/service.py apps/api/src/modules/dashboard/router.py apps/api/tests/test_healthcheck_dashboard_api.py
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
PYTHONPATH=. python -m pytest apps/api/tests -q
npm run verify:health-dashboard-server-only
npm run verify:perimeter-policy
git diff --check
```

## Review routing
- Chopper: security boundary; confirm no new host/source exposure and sanitized behavior remains intact.
- Franky: operational semantics; confirm timestamp/severity aggregation and no runtime/config regression.
- Usopp: not required; no frontend visible change.

## Risks
- Future real sources may emit malformed timestamps. Current behavior ignores invalid timestamps for latest-update selection rather than exposing parse errors or raw values in summaries.
- Future deployment may require backend host allowlist enforcement, but this microphase does not introduce it because no new topology/source connector is added.

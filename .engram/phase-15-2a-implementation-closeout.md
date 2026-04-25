# Phase 15.2a implementation closeout

## Status
Implemented on branch `zoro/phase-15-2a-health-source-vocabulary`.

## What changed
- Healthcheck domain now owns the Phase 15 source-family vocabulary and stable `check_id` mapping.
- Healthcheck service validates source IDs, status, severity and freshness states before serializing module/signal output.
- Signal IDs now resolve through the backend allowlist instead of `f'{module_id}-safe-signal'`.
- Fixture-backed Healthcheck records were realigned to the Phase 15 families without adding live reads.
- Tests cover allowed vocabulary, invalid-value rejection and dynamic/path-like source ID rejection.
- `docs/read-models.md` and `docs/api-modules.md` document the vocabulary and no-live-read boundary.

## Boundary preserved
Phase 15.2a does not read manifests, filesystem, Git/GitHub, systemd, cronjobs, shell, Docker, subprocess or host logs. Phase 15.2b remains responsible for unsafe-field normalization/rejection from adapter-like payloads. Phase 15.2c remains responsible for anti host-console guardrails, manifest ownership/location and freshness thresholds.

## Verification
- `python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py`
- `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q`
- `npm run verify:health-dashboard-server-only`
- `npm run verify:perimeter-policy`
- `git diff --check`

## Review routing
PR should request Franky + Chopper:
- Franky: source-family naming, operational feasibility and no accidental live adapter behavior.
- Chopper: allowlist semantics, no dynamic ID derivation and no widened host/data exposure.

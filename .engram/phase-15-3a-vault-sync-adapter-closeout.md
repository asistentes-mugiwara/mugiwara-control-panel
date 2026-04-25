# Phase 15.3a closeout — Vault sync safe adapter

## What changed
- Added `apps/api/src/modules/healthcheck/source_adapters.py` with `VaultSyncManifestAdapter`.
- Wired `HealthcheckService()` defaults so the `vault-sync` fixture is replaced by the adapter snapshot while the remaining safe catalog stays available.
- Added backend tests for recent success, stale timestamp, missing manifest, unreadable manifest and sanitized/noisy manifest fields.
- Updated Healthcheck source policy/read-model/API docs and added OpenSpec + verify checklist.

## Key decisions
- 15.3 was split: 15.3a covers `vault-sync` only; local backup health remains a separate 15.3b microphase.
- The adapter reads only a fixed Franky-owned manifest path and consumes only safe result/timestamp semantics.
- Missing manifest maps to `not_configured`; unreadable or invalid manifest maps to `unknown`; neither becomes healthy output.
- Manifest fields such as path, stdout, remote URL, branch or counts are not serialized. Public text still goes through `HealthcheckSourceRegistry`.

## Verification
Passed:
- `python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/registry.py apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py`
- `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q`
- `PYTHONPATH=. python -m pytest apps/api/tests -q`
- `npm run verify:healthcheck-source-policy`
- `npm run verify:perimeter-policy`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:health-dashboard-server-only`
- `git diff --check`

## Continuity
- Review needed: Franky + Chopper.
- Next implementation slice should be 15.3b for local backup safe adapter, using the same adapter/registry pattern but with backup-specific manifest semantics and leakage tests.
- Do not add project health, gateways or cronjobs until their planned microphases.

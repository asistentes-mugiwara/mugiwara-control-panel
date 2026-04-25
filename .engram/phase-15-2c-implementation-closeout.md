# Phase 15.2c implementation closeout

## Result
Phase 15.2c closes the Healthcheck source foundation before live adapters by adding static guardrails, manifest ownership policy and freshness thresholds.

## Key technical points
- `apps/api/src/modules/healthcheck/domain.py` now owns manifest policy and threshold constants for Phase 15 source families.
- `scripts/check-healthcheck-source-policy.mjs` blocks generic host-console patterns in Healthcheck module source and verifies policy docs/scripts remain wired.
- `docs/healthcheck-source-policy.md` defines owners, safe location classes, sensitivity exclusions and thresholds.
- `package.json` exposes `npm run verify:healthcheck-source-policy`.
- Existing Healthcheck registry normalizer from Phase 15.2b remains the only bridge for future adapter-like payloads.

## TDD/verify
- Red run: `npm run verify:healthcheck-source-policy` failed on missing `scripts/check-healthcheck-source-policy.mjs`.
- Red run: `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` failed on missing policy constants.
- Green verify:
  - `python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/registry.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py`
  - `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q`
  - `npm run verify:health-dashboard-server-only`
  - `npm run verify:perimeter-policy`
  - `npm run verify:healthcheck-source-policy`
  - `git diff --check`

## Out of scope kept
No manifests were read. No live adapters, filesystem discovery, Git/GitHub queries, systemd, cron runtime, shell, Docker, subprocess or threshold application against live data were added.

## Next
Open PR and request Franky + Chopper review. After merge, Phase 15.3 can start vault sync + local backup adapters using this policy boundary.

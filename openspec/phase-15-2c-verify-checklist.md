# Phase 15.2c verify checklist

- [x] Branch created from current `main`: `zoro/phase-15-2c-health-source-policy`.
- [x] TDD red run observed: `npm run verify:healthcheck-source-policy` failed on missing guardrail file after package script was added.
- [x] TDD red run observed: `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` failed on missing policy constants before implementation.
- [x] Backend-owned manifest ownership policy exists in `apps/api/src/modules/healthcheck/domain.py`.
- [x] Backend-owned freshness thresholds exist in `apps/api/src/modules/healthcheck/domain.py`.
- [x] `docs/healthcheck-source-policy.md` documents owner, safe location class and sensitivity exclusions per source family.
- [x] `docs/healthcheck-source-policy.md` documents initial freshness thresholds for vault sync, project health, backup, gateways and cronjobs.
- [x] `npm run verify:healthcheck-source-policy` is wired in `package.json` and passes.
- [x] No live source adapters, manifest reads, filesystem discovery, Git/GitHub queries, systemd, shell, Docker, subprocess or cron runtime visibility were added.
- [x] Existing Healthcheck/Dashboard API compatibility tests pass.
- [x] Existing perimeter guardrails pass.
- [ ] PR review handoff requested from Franky + Chopper.

## Verify commands

```bash
python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/registry.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
npm run verify:health-dashboard-server-only
npm run verify:perimeter-policy
npm run verify:healthcheck-source-policy
git diff --check
```

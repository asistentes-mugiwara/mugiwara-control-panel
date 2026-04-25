# Phase 15.2c — Guardrails, manifest ownership and freshness policy

## Goal
Close the final Phase 15.2 Healthcheck foundation slice before live real-source adapters by adding static host-console guardrails, manifest ownership policy and backend-owned freshness thresholds.

## Scope delivered
- Added `HEALTHCHECK_SOURCE_MANIFEST_POLICIES` in `apps/api/src/modules/healthcheck/domain.py`.
- Added `HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS` in `apps/api/src/modules/healthcheck/domain.py`.
- Added a cheap static guardrail command: `npm run verify:healthcheck-source-policy`.
- Added `scripts/check-healthcheck-source-policy.mjs` to block accidental generic host-console patterns in Healthcheck module source.
- Added dedicated policy docs in `docs/healthcheck-source-policy.md`.
- Linked the policy from `docs/api-modules.md`, `docs/read-models.md` and `docs/security-perimeter.md`.
- Added backend tests proving the policy is backend-owned and does not encode absolute safe paths.

## Explicitly out of scope
- No live manifest reads.
- No filesystem discovery.
- No Git/GitHub queries.
- No systemd, shell, Docker, subprocess or cron runtime integration.
- No application of thresholds to live data.
- No Dashboard aggregation change.

## TDD notes
Red checks observed before implementation:
- `npm run verify:healthcheck-source-policy` failed because the package script pointed to a missing guardrail file.
- `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` failed during collection because `HEALTHCHECK_SOURCE_FRESHNESS_THRESHOLDS` and `HEALTHCHECK_SOURCE_MANIFEST_POLICIES` did not exist yet.

## Policy summary
Manifest ownership:
- `vault-sync`: Franky-owned operational source.
- `backup-health`: Franky-owned operational source.
- `cronjobs`: Franky-owned shared manifest registry, not inferred from Zoro profile-local `cronjob list`.
- `hermes-gateways` and `gateway.<mugiwara-slug>`: Franky-owned gateway status summaries.
- `project-health`: Zoro-owned repo-local project health summary.

Initial freshness thresholds:
- `vault-sync`: warn 90 min, fail 360 min.
- `project-health`: warn 120 min, fail 480 min.
- `backup-health`: warn 1800 min, fail 4320 min.
- gateways: warn 15 min, fail 60 min.
- `cronjobs`: warn 180 min, fail 720 min.

## Security boundary
The new guardrail scans Healthcheck module Python source for generic host-console growth: subprocess imports/usage, `os.system`, `shell=True`, `exec`, `eval`, command-parameter adapters and generic URL fetch libraries. It deliberately does not approve any live adapter; it only freezes the deny-by-default boundary before Phase 15.3+.

## Verify checklist
See `openspec/phase-15-2c-verify-checklist.md`.

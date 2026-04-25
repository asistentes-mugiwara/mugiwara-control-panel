# Phase 15.2a — Health source vocabulary and stable IDs

## Goal
Close the first implementation slice of the Phase 15.2 Healthcheck foundation by moving source-family vocabulary, status/severity/freshness values and signal `check_id` resolution into backend-owned allowlists.

## Scope delivered
- Added backend-owned Healthcheck source family IDs for:
  - `vault-sync`
  - `project-health`
  - `backup-health`
  - `hermes-gateways`
  - `gateway.<mugiwara-slug>` for all current Mugiwara slugs
  - `cronjobs`
- Added stable `check_id` mapping for the Phase 15 source families.
- Added allowed vocabularies for:
  - status: `pass`, `warn`, `fail`, `stale`, `not_configured`, `unknown`
  - severity: `low`, `medium`, `high`, `critical`, `unknown`
  - freshness state: `fresh`, `stale`, `unknown`
- Changed Healthcheck signal generation so `check_id` is resolved from the backend allowlist rather than derived from arbitrary record IDs.
- Kept current output shape compatible: `/api/v1/healthcheck` still returns `summary_bar`, `modules`, `events`, `principles` and `signals`; `/api/v1/dashboard` continues aggregating the same safe shape.
- Updated docs with the Phase 15.2a vocabulary.

## Explicitly out of scope
- No manifest reads.
- No filesystem reads.
- No Git/GitHub queries.
- No systemd, shell, Docker or subprocess access.
- No cronjob runtime visibility.
- No UI layout change.
- No unsafe raw-field normalizer yet; that remains Phase 15.2b.
- No host-console guardrail/freshness thresholds yet; that remains Phase 15.2c.

## TDD notes
Added tests first for:
- backend-owned vocabulary constants;
- invalid status/severity/freshness rejection;
- stable signal `check_id` allowlist resolution;
- rejection of dynamic/path-like source IDs.

The first targeted run failed on missing constants, then the implementation made the suite pass.

## Security boundary
This phase tightens contracts but does not broaden host visibility. The Healthcheck fixture catalog remains safe and public-repo compatible. Source IDs and check IDs are now explicit backend code, not client-provided strings, dynamic service discovery or filesystem-derived values.

## Verify checklist
See `openspec/phase-15-2a-verify-checklist.md`.

# Phase 15.3a — Vault sync safe adapter

## Objective
Connect the first live Healthcheck source for Phase 15.3: `vault-sync` only.

This microphase reads a fixed, Franky-owned vault sync status manifest and exposes only a sanitized Healthcheck summary through the existing backend-owned source registry.

## Why split 15.3
Phase 15.3 originally covered both vault sync and local backups. That is too broad for the first live-source PR because each source family has different operational ownership, manifest semantics and leakage risks.

15.3a therefore proves the pattern with `vault-sync` only. Backup health remains for 15.3b.

## Scope
- Add `VaultSyncManifestAdapter` under the Healthcheck backend module.
- Read only a fixed allowlisted status manifest path owned by operations.
- Accept only safe manifest semantics: result/status and timestamp fields.
- Derive Healthcheck `status`, `severity`, `freshness_state`, summary and warning text from backend-owned policy.
- Route adapter output through `HealthcheckSourceRegistry` so label ownership, field allowlisting and sensitive-text fallback still apply.
- Replace the default fixture-backed `vault-sync` record with the adapter snapshot while preserving the rest of the safe catalog.
- Update Healthcheck docs/read-models/source-policy.

## Out of scope
- Backup adapter.
- Project health adapter.
- Gateway/systemd adapter.
- Cronjob registry adapter.
- Shell, subprocess, Git command execution, GitHub API calls, generic filesystem discovery or URL fetches.
- Exposing manifest path, branch name, remote URL, Git output, raw output, stdout/stderr, diff, untracked files or internal runtime details.

## Manifest contract
The adapter treats the manifest as an operational input, not a public API. It consumes only:

- `status` or `result`: safe enum-like status values.
- `last_success_at` or `updated_at`: ISO timestamp.

Other manifest fields are ignored before serialization. If the manifest is missing, output is `not_configured`; if it is unreadable or invalid JSON, output is `unknown`. Neither case becomes healthy output.

## Freshness policy
Uses the existing backend-owned `vault-sync` thresholds:

- warn after 90 minutes.
- fail/stale after 360 minutes.

Recent successful status becomes `pass/low/fresh`. Warning/divergence-like status becomes `warn/medium/stale`. Old successful timestamps become `warn` or `stale` depending on age. Error/fail status becomes `fail/high/stale`.

## Definition of done
- Tests cover recent success, stale timestamp, missing manifest and unreadable manifest.
- Tests prove noisy manifest fields do not reach the serialized workspace.
- `/api/v1/healthcheck` continues to return a sanitized read model.
- Static Healthcheck source-policy guardrail still passes.
- No new generic host-console pattern appears in Healthcheck source code.
- Docs and closeout are updated.

## Verify
Run from repo root:

```bash
python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/registry.py apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
PYTHONPATH=. python -m pytest apps/api/tests -q
npm run verify:healthcheck-source-policy
npm run verify:perimeter-policy
git diff --check
```

## Review
Request Franky + Chopper:

- Franky: operational feasibility of the fixed manifest adapter and freshness semantics.
- Chopper: leakage boundary, sanitizer preservation and absence of generic host reads.

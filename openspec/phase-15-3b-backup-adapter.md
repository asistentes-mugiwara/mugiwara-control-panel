# Phase 15.3b — Local backup safe adapter

## Objective
Connect the second live Healthcheck source for Phase 15.3: `backup-health` only.

This microphase reads a fixed, Franky-owned local backup status manifest and exposes only a sanitized Healthcheck summary through the existing backend-owned source registry.

## Why split 15.3b
Phase 15.3 originally covered vault sync and local backups together. Phase 15.3a proved the live-source pattern with `vault-sync`. 15.3b keeps backup health isolated because backup manifests have different operational semantics and leakage risks: archive names, backup paths, included paths, checksums and retention metadata must not become public API output.

## Scope
- Add `BackupHealthManifestAdapter` under the Healthcheck backend module.
- Read only a fixed allowlisted backup status manifest path owned by operations.
- Consume only safe manifest semantics: `status|result`, `last_success_at|updated_at`, `checksum_present` and `retention_count`.
- Derive Healthcheck `status`, `severity`, `freshness_state`, summary and warning text from backend-owned policy.
- Route adapter output through `HealthcheckSourceRegistry` so label ownership, field allowlisting and sensitive-text fallback still apply.
- Replace the default fixture-backed `backup-health` record with the adapter snapshot while preserving the rest of the safe catalog.
- Update Healthcheck docs/read-models/source-policy.

## Out of scope
- Producing or scheduling the real backup manifest.
- Drive/private remote backup health.
- Project health adapter.
- Gateway/systemd adapter.
- Cronjob registry adapter.
- Shell, subprocess, backup command execution, generic filesystem discovery, archive enumeration or URL fetches.
- Exposing archive paths/names, included paths, backup paths, file sizes, checksums, stdout/stderr, raw output, logs, manifest internals or credentials.

## Manifest contract
The adapter treats the manifest as an operational input, not a public API. It consumes only:

- `status` or `result`: safe enum-like status values.
- `last_success_at` or `updated_at`: ISO timestamp.
- `checksum_present`: boolean.
- `retention_count`: integer count against the expected local retention of 4.

Other manifest fields are ignored before serialization. If the manifest is missing, output is `not_configured`; if it is unreadable or invalid JSON, output is `unknown`. Neither case becomes healthy output.

## Freshness policy
Uses the existing backend-owned `backup-health` thresholds:

- warn after 1800 minutes.
- fail/stale after 4320 minutes.

Recent successful status with checksum available becomes `pass/low/fresh`. Missing checksum or incomplete retention becomes `warn/medium/stale`. Old successful timestamps become `warn` or `stale` depending on age. Error/fail status becomes `fail/high/stale`.

## Definition of done
- Tests cover recent success, stale timestamp, missing checksum, missing manifest and unreadable manifest.
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
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
npm run verify:health-dashboard-server-only
git diff --check
```

## Review
Request Franky + Chopper:

- Franky: operational manifest contract, checksum/retention semantics and freshness thresholds.
- Chopper: leakage boundary, sanitizer preservation and absence of generic host reads.

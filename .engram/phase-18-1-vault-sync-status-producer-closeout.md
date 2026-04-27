# Phase 18.1 — vault-sync-status producer closeout

## Scope
Implemented the `vault-sync-status` Healthcheck producer only. Runner/timer remains Phase 18.2; `backup-health-status` remains Phase 18.3.

## Decisions
- Source gate found `/srv/crew-core/scripts/vault-sync.sh` as an operational source safe enough for Phase 18.1.
- `scripts/write-vault-sync-status.py` runs that fixed reviewed script outside the backend and consumes only its exit code.
- The manifest at `/srv/crew-core/runtime/healthcheck/vault-sync-status.json` serializes only `status`, `result`, `updated_at` and `last_success_at` on explicit success.
- Missing/non-executable source, non-zero exit or timeout writes `failed` fail-closed rather than inventing green status.
- Backend Healthcheck remains unchanged and still reads only the fixed manifest; no shell/Git/systemd/filesystem discovery was added to `apps/api/src/modules/healthcheck`.

## Files
- `scripts/write-vault-sync-status.py` — producer with atomic write, file mode `0640`, directory mode `0750`, parent-directory fsync and safe CLI.
- `apps/api/tests/test_vault_sync_status_manifest_producer.py` — unit tests for success, failure, missing source, CLI and no-leakage.
- `scripts/check-vault-sync-status-producer.mjs` — static guardrail for producer contract.
- `scripts/check-healthcheck-source-policy.mjs`, `package.json` — verify wiring.
- `docs/healthcheck-source-policy.md`, `docs/read-models.md`, `docs/api-modules.md` — docs viva.
- `openspec/phase-18-1-vault-sync-status-producer.md` — microphase spec/checklist.

## Verify
- `python3 -m py_compile scripts/write-vault-sync-status.py apps/api/tests/test_vault_sync_status_manifest_producer.py`
- `python3 -m pytest apps/api/tests/test_vault_sync_status_manifest_producer.py apps/api/tests/test_healthcheck_dashboard_api.py -q` → 52 passed
- `npm run verify:vault-sync-status-producer` → passed
- `npm run verify:healthcheck-source-policy` → passed
- `npm run write:vault-sync-status` → wrote real manifest with `status=success`
- Manifest validation: keys `status,result,updated_at,last_success_at`, file `0640`, dir `0750`, no sensitive markers detected
- FastAPI smoke `GET /api/v1/healthcheck` → 200, includes `vault-sync`, no sensitive markers detected
- `git diff --check` → passed

## Review required
PR requires Franky + Chopper. Franky should validate operational source, exit-code semantics, permissions/atomicity and Phase 18.2 runner assumptions. Chopper should validate no-leakage and backend/host boundary.

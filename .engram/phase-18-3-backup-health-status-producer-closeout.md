# Phase 18.3 — backup-health-status producer closeout

## Scope
Implemented only the producer for `/srv/crew-core/runtime/healthcheck/backup-health-status.json`.

## Decision
The producer does not run backups. It observes the fixed local backup artifact directory, validates the latest checksum with silent `sha256sum -c`, derives aggregate `checksum_present` and `retention_count`, and writes a minimal manifest atomically with `0750` directory and `0640` file permissions.

## Safety
No archive names, paths, sizes, hashes, Drive targets, stdout/stderr, logs, raw output, errors, commands, tokens, `.env` values or credentials are serialized.

## Verify
- Red test first: producer tests failed because `scripts/write-backup-health-status.py` did not exist.
- `python3 -m py_compile scripts/write-backup-health-status.py apps/api/tests/test_backup_health_status_manifest_producer.py apps/api/tests/test_healthcheck_dashboard_api.py`
- `PYTHONPATH=. pytest apps/api/tests/test_backup_health_status_manifest_producer.py apps/api/tests/test_healthcheck_dashboard_api.py -q` → 55 passed.
- `npm run verify:backup-health-status-producer` → passed.
- `npm run verify:healthcheck-source-policy` → passed.
- `npm run write:backup-health-status` → wrote real manifest with status success, checksum_present true, retention_count 4.
- Real manifest validation: expected shape, directory `0750`, file `0640`, leakage scan none.
- FastAPI TestClient smoke `/api/v1/healthcheck`: HTTP 200, `backup-health` pass, sanitized true.
- `git diff --check` → passed.

## Test adjustment
The live API smoke tests no longer assume at least one degraded source in the host default state, because Phase 18.3 can make all fixed manifests present and fresh. Degraded source visibility remains covered with an explicit missing backup manifest fixture.

## Next
Phase 18.4 remains the separate runner/timer or post-backup hook decision. Do not start it from this phase.

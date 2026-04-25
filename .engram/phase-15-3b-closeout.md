# Phase 15.3b closeout — Backup health adapter

## Summary
Implemented a source-specific `backup-health` live adapter for Healthcheck. The adapter reads only the fixed Franky-owned local backup status manifest at `/srv/crew-core/runtime/healthcheck/backup-health-status.json`, consumes safe status/timestamp/checksum/retention fields and routes the result through `HealthcheckSourceRegistry` before serialization.

## Security boundary
- No shell, subprocess, backup command execution, generic URL fetch, filesystem discovery or archive enumeration.
- Missing manifest -> `not_configured`; unreadable/invalid manifest -> `unknown`.
- Manifest noise such as archive paths, included paths, stdout/raw output and token markers is ignored before serialization.
- The source registry remains the final label owner and text sanitizer.

## Verify
- `python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/registry.py apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py`
- `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q`
- `PYTHONPATH=. python -m pytest apps/api/tests -q`
- `npm run verify:healthcheck-source-policy`
- `npm run verify:perimeter-policy`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:health-dashboard-server-only`
- `git diff --check`

## Next
15.4 can move to `project-health` adapter. The real backup manifest producer remains an operational follow-up for Franky, not part of this backend adapter PR.

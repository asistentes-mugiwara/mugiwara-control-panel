# Phase 15.3b — Verify checklist

## Scope verified
- [x] `BackupHealthManifestAdapter` added as the second live Healthcheck source adapter.
- [x] Adapter is source-specific and fixed to `backup-health`; no generic host console, shell, subprocess, backup command, URL fetch or filesystem discovery added.
- [x] Manifest values are reduced to safe status/timestamp/checksum/retention semantics before entering the public read model.
- [x] Output still passes through `HealthcheckSourceRegistry` label ownership, allowlist filtering and text sanitizer.
- [x] Missing manifest degrades to `not_configured`; unreadable/invalid manifest degrades to `unknown`.
- [x] Docs updated in `docs/api-modules.md`, `docs/read-models.md` and `docs/healthcheck-source-policy.md`.

## Automated verify
Executed from repo root on branch `zoro/phase-15-3b-backup-adapter`:

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

Result: all passed.

## Security/leakage checks
- [x] Regression test injects manifest noise containing archive path, included path, stdout/raw output and token markers; serialized workspace remains sanitized.
- [x] Adapter ignores archive paths/names, included paths, backup paths, stdout/stderr/raw output, file sizes and other manifest internals.
- [x] No project/gateway/cronjob live reads introduced.

## Review routing
Request Franky + Chopper before merge:
- Franky for operational manifest, checksum/retention contract and freshness semantics.
- Chopper for host/leakage boundary.

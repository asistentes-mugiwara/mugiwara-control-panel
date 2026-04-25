# Phase 15.3a — Verify checklist

## Scope verified
- [x] `VaultSyncManifestAdapter` added as the first live Healthcheck source adapter.
- [x] Adapter is source-specific and fixed to `vault-sync`; no generic host console, shell, subprocess, Git command, GitHub API, URL fetch or filesystem discovery added.
- [x] Manifest values are reduced to safe status/timestamp semantics before entering the public read model.
- [x] Output still passes through `HealthcheckSourceRegistry` label ownership, allowlist filtering and text sanitizer.
- [x] Missing manifest degrades to `not_configured`; unreadable/invalid manifest degrades to `unknown`.
- [x] Docs updated in `docs/api-modules.md`, `docs/read-models.md` and `docs/healthcheck-source-policy.md`.

## Automated verify
Executed from repo root on branch `zoro/phase-15-3a-vault-sync-adapter`:

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
- [x] Regression test injects manifest noise containing host path, `.env`, token/raw output and internal remote fields; serialized workspace remains sanitized.
- [x] Adapter ignores branch/ahead/behind/path/stdout/remote fields in the manifest.
- [x] No backup/project/gateway/cronjob live reads introduced.

## Review routing
Request Franky + Chopper before merge:
- Franky for operational manifest and freshness semantics.
- Chopper for host/leakage boundary.

# Phase 15.6a — Verify checklist

## Scope checks
- [x] `CronjobsManifestAdapter` consume solo manifiesto fijo `cronjobs-status.json`.
- [x] El backend no consulta cron/systemd/Hermes cron runtime ni `cronjob list`.
- [x] El payload público no expone job names, owner profiles, prompt bodies, commands, chat IDs, delivery targets, logs, stdout/stderr ni raw outputs.
- [x] Manifiesto ausente, ilegible, vacío, parcial, stale y failed degradan de forma visible.
- [x] `HealthcheckService` usa el snapshot real del adapter para sustituir el fixture `cronjobs` por defecto.
- [x] Docs y `verify:healthcheck-source-policy` reflejan Phase 15.6a.

## TDD evidence
- [x] RED: `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` falló inicialmente por `ImportError: cannot import name 'CronjobsManifestAdapter'`.
- [x] GREEN dirigido: `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` → `47 passed`.

## Verify evidence
- [x] `python -m py_compile apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py` → passed
- [x] `npm run verify:healthcheck-source-policy` → passed
- [x] `npm run verify:perimeter-policy` → passed
- [x] `PYTHONPATH=. python -m pytest apps/api/tests -q` → `79 passed`
- [x] `npm --prefix apps/web run typecheck` → passed
- [x] `npm --prefix apps/web run build` → passed
- [x] `git diff --check` → passed

## Review gate
- [ ] Franky review requested.
- [ ] Chopper review requested.
- [ ] Review comments addressed or explicitly deferred.

# Phase 15.2a verify checklist

- [x] Branch created from current `main`: `zoro/phase-15-2a-health-source-vocabulary`.
- [x] TDD red run observed: `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` failed on missing Phase 15.2a constants before implementation.
- [x] Backend-owned source family vocabulary exists in `apps/api/src/modules/healthcheck/domain.py`.
- [x] Stable `check_id` mapping exists in backend-owned code and Healthcheck signals use it.
- [x] Invalid `status`, `severity` and `freshness.state` cannot silently become healthy output.
- [x] Dynamic/path-like source IDs are rejected by service conversion.
- [x] No live source reads added: no manifest, filesystem, Git/GitHub, systemd, cronjob runtime, shell, Docker or subprocess integration.
- [x] `docs/read-models.md` documents the source-family vocabulary.
- [x] `docs/api-modules.md` reflects the backend-owned Healthcheck vocabulary.
- [x] `python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py`
- [x] `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q`
- [x] `npm run verify:health-dashboard-server-only`
- [x] `npm run verify:perimeter-policy`
- [x] `git diff --check`

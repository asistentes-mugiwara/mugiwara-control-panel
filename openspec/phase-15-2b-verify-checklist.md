# Phase 15.2b verify checklist

- [x] Branch created from current `main`: `zoro/phase-15-2b-health-source-normalizer`.
- [x] TDD red run observed: `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` failed on missing `apps.api.src.modules.healthcheck.registry` before implementation.
- [x] Backend-owned Healthcheck source registry/normalizer exists in `apps/api/src/modules/healthcheck/registry.py`.
- [x] Registry output serializes only allowlisted Healthcheck fields.
- [x] Unsafe adapter-like fields are dropped before service/API-shaped output.
- [x] Absent/unreadable/unregistered sources are represented as degraded `not_configured` or `unknown`, never `pass`.
- [x] Unsupported source ID errors do not echo rejected raw values.
- [x] No live source reads added: no manifest, filesystem, Git/GitHub, systemd, cronjob runtime, shell, Docker or subprocess integration.
- [x] `docs/read-models.md` documents registry normalization semantics.
- [x] `docs/api-modules.md` reflects the allowlist-only Healthcheck normalizer.
- [x] `python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/registry.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py`
- [x] `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q`
- [x] `npm run verify:health-dashboard-server-only`
- [x] `npm run verify:perimeter-policy`
- [x] `git diff --check`

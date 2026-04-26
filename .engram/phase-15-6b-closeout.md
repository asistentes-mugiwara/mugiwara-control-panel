# Phase 15.6b closeout — Cronjobs status manifest producer

## Resultado
Phase 15.6b añade el productor/runner Franky-owned del manifiesto Healthcheck `cronjobs-status`, cerrando el follow-up #56 de la Phase 15.6a.

## Cambios
- `scripts/write-cronjobs-status.py` lee registros cron de perfiles Hermes allowlisted y escribe `/srv/crew-core/runtime/healthcheck/cronjobs-status.json`.
- El manifiesto serializa solo `status`, `result`, `updated_at` y `jobs[].last_run_at|last_status|criticality`.
- El productor filtra one-shots y jobs normales sin primera ejecución registrada para evitar falsos warning; el cron frecuente `vault-sync` queda como `critical`.
- `ops/systemd/user/mugiwara-cronjobs-status.service` y `.timer` refrescan el manifiesto cada 5 minutos.
- `scripts/install-cronjobs-status-user-timer.sh` instala/activa el timer user-level.
- `scripts/check-cronjobs-status-runner.mjs` y `verify:cronjobs-status-runner` fijan el contrato estático.
- Docs vivas actualizadas: `docs/healthcheck-source-policy.md`, `docs/read-models.md`, `docs/api-modules.md`.

## Seguridad
- No se serializan nombres de jobs, perfiles propietarios, prompts, comandos, chat IDs, delivery targets, stdout/stderr, logs, raw outputs, rutas host, tokens ni credenciales.
- El backend Healthcheck sigue sin ejecutar cron/Hermes CLI/shell ni leer registries directamente; consume solo el manifiesto fijo saneado.
- La unidad systemd no pasa `--output` ni `--profiles-root`; usa rutas fijas revisadas.

## Verify ejecutado
- `PYTHONPATH=. python -m pytest apps/api/tests/test_cronjobs_status_manifest_producer.py apps/api/tests/test_healthcheck_dashboard_api.py -q` → 50 passed.
- `python -m py_compile scripts/write-cronjobs-status.py apps/api/tests/test_cronjobs_status_manifest_producer.py apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py` → OK.
- `npm run verify:cronjobs-status-runner` → OK.
- `npm run verify:healthcheck-source-policy` → OK.
- `npm run verify:perimeter-policy` → OK.
- `systemd-analyze --user verify ops/systemd/user/mugiwara-cronjobs-status.service ops/systemd/user/mugiwara-cronjobs-status.timer` → OK.
- `PYTHONPATH=. python -m pytest apps/api/tests -q` → 82 passed.
- `npm --prefix apps/web run typecheck` → OK.
- `npm --prefix apps/web run build` → OK.
- `git diff --check` → OK.
- `npm run write:cronjobs-status` → manifiesto real escrito y saneado.
- `scripts/install-cronjobs-status-user-timer.sh` + `systemctl --user start mugiwara-cronjobs-status.service` + `systemctl --user is-active mugiwara-cronjobs-status.timer` → timer activo.

## Riesgos / follow-ups
- La allowlist de perfiles cron es deliberadamente explícita (`luffy`, `franky`, `usopp`, `sanji`); si otro perfil añade cronjobs operativos, debe ampliarse en una microfase revisada.
- La semántica `critical` queda limitada a `vault-sync` por compatibilidad con el threshold 180/720 min; jobs diarios/largos se vigilan por fuentes dedicadas o futuros follow-ups.

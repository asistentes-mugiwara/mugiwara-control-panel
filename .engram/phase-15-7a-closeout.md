# Phase 15.7a closeout — Cronjobs registry size limit

## Resultado
Phase 15.7a cierra el hardening follow-up #58 de la Phase 15.6b: el productor `cronjobs-status` ya no parsea registries cron allowlisted sin límite de tamaño previo.

## Cambios
- `scripts/write-cronjobs-status.py` añade `MAX_CRON_REGISTRY_BYTES = 1_048_576` y comprueba `jobs.json` con `stat().st_size` antes de `json.loads`.
- Un registry oversized falla cerrado con `CronjobsStatusProducerError('cron registry exceeds safe size limit')`.
- El productor no escribe manifiesto nuevo cuando detecta oversized registry; el manifiesto anterior queda sujeto a freshness/stale por el adapter existente.
- `apps/api/tests/test_cronjobs_status_manifest_producer.py` cubre contenido sintético sensible en un registry oversized y valida que no aparece en el error ni en output.
- `scripts/check-cronjobs-status-runner.mjs` fija el nuevo contrato estático.
- Docs vivas actualizadas: `docs/healthcheck-source-policy.md`, `docs/read-models.md`, `docs/api-modules.md`.

## Seguridad
- No se loggea ni serializa contenido del registry oversized.
- El error no incluye ruta, perfil, tamaño exacto, job names, prompts, comandos, chat IDs, targets, stdout/stderr, raw outputs, rutas host, tokens ni credenciales.
- El backend Healthcheck permanece unchanged y consume solo el manifiesto fijo saneado.

## Verify ejecutado
- `PYTHONPATH=. python -m pytest apps/api/tests/test_cronjobs_status_manifest_producer.py -q` → 4 passed.
- `python -m py_compile scripts/write-cronjobs-status.py apps/api/tests/test_cronjobs_status_manifest_producer.py` → OK.
- `npm run verify:cronjobs-status-runner` → OK.
- `npm run verify:healthcheck-source-policy` → OK.
- `npm run write:cronjobs-status` → manifiesto real escrito; shape/permisos validados (`0640` fichero, `0750` directorio).
- `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` → 47 passed.
- `PYTHONPATH=. python -m pytest apps/api/tests -q` → 83 passed.
- `npm --prefix apps/web run typecheck` → OK.
- `npm --prefix apps/web run build` → OK.
- `git diff --check` → OK.

## Riesgos / follow-ups
- El límite de 1 MiB es deliberadamente conservador y debería ser holgado para registries cron reales actuales; si el número de cronjobs crece de forma material, ampliar el límite debe hacerse como cambio revisado.
- Si el producer falla por oversized registry, no actualiza el manifiesto. El estado operativo se degradará por freshness si el problema persiste.

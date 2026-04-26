# Phase 15.7a — Cronjobs registry size limit

## Objetivo
Cerrar el follow-up #58 de PR #57: añadir un límite defensivo de tamaño antes de `json.loads` en cada registry cron allowlisted consumido por `scripts/write-cronjobs-status.py`.

## Por qué ahora
Phase 15.6b dejó el productor cronjobs seguro en cuanto a shape y no leakage, pero Chopper marcó como hardening menor que un `jobs.json` local allowlisted demasiado grande no debería parsearse sin límite previo. La fuente sigue siendo local/allowlisted, así que no era blocker de merge, pero encaja como microfase corta de seguridad/operabilidad.

## Alcance
- Añadir constante fija `MAX_CRON_REGISTRY_BYTES = 1_048_576` en el productor.
- Comprobar `registry_path.stat().st_size` antes de leer/parsear el JSON.
- Fallar de forma cerrada con error saneado si el registry supera el límite.
- Añadir test de productor para oversized registry con contenido sintético sensible y comprobar que no se filtra en el error ni se escribe manifiesto.
- Reforzar `verify:cronjobs-status-runner` para fijar el nuevo contrato.
- Actualizar docs vivas de Healthcheck.

## Fuera de alcance
- Cambiar el backend `CronjobsManifestAdapter`.
- Cambiar la unidad systemd o la cadencia del timer.
- Añadir streaming parser, truncado parcial o warnings por job.
- Ampliar allowlist de perfiles cron.
- Exponer contenido del registry, rutas internas o nombres de jobs en errores.

## Decisiones técnicas
- El límite inicial es 1 MiB por `jobs.json`: suficiente para registros cron saneados y alto de sobra para el tamaño actual esperado, pero evita parseos accidentales de ficheros enormes.
- La política elegida es fail-closed: si un registry allowlisted supera el límite, el productor no escribe manifiesto nuevo. El manifiesto anterior seguirá siendo evaluado por freshness y eventualmente degradará a `stale`.
- El error público del productor es genérico (`cron registry exceeds safe size limit`) y no incluye ruta, perfil, contenido ni tamaño exacto.
- El backend permanece unchanged: consume solo `/srv/crew-core/runtime/healthcheck/cronjobs-status.json`.

## Verify esperado
```bash
PYTHONPATH=. python -m pytest apps/api/tests/test_cronjobs_status_manifest_producer.py -q
python -m py_compile scripts/write-cronjobs-status.py apps/api/tests/test_cronjobs_status_manifest_producer.py
npm run verify:cronjobs-status-runner
npm run verify:healthcheck-source-policy
npm run write:cronjobs-status
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
PYTHONPATH=. python -m pytest apps/api/tests -q
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
git diff --check
```

## Review requerido
Franky + Chopper.

- Franky: fail-closed operativo, compatibilidad con runner/timer y que el límite no genere falsos positivos para registries reales.
- Chopper: no parseo previo al límite, no leakage en errores y frontera backend intacta.

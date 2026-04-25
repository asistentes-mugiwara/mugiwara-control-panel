# Phase 15.6a — Cronjobs manifest adapter

## Objetivo
Conectar Healthcheck a una fuente real y saneada de cronjobs mediante un reader backend fijo sobre un manifiesto Franky-owned, sin convertir el backend en consola de cron, sin leer prompts/comandos/logs y sin asumir que `cronjob list` del perfil Zoro representa el estado global.

## Alcance
- Añadir `CronjobsManifestAdapter` en `apps/api/src/modules/healthcheck/source_adapters.py`.
- Consumir solo `/srv/crew-core/runtime/healthcheck/cronjobs-status.json` como ubicación fija de manifiesto.
- Integrar el snapshot `cronjobs` en el flujo por defecto de `HealthcheckService`.
- Consumir semántica mínima:
  - `updated_at` / `last_success_at` del manifiesto.
  - `status` / `result` del manifiesto.
  - por job: `last_run_at`, `last_status` y `criticality`.
- Degradar manifiesto ausente, ilegible, vacío, parcial, stale o failed a estados visibles (`not_configured`, `unknown`, `warn`, `stale`, `fail`).
- Mantener `HealthcheckSourceRegistry` como sanitizador final y resolver labels desde vocabulario backend-owned.
- Actualizar docs y guardrail `verify:healthcheck-source-policy`.

## Fuera de alcance
- Crear el productor del manifiesto de cronjobs.
- Consultar cron/systemd/Hermes cron runtime desde el backend.
- Usar `cronjob list` del perfil Zoro como fuente global.
- Exponer nombres de jobs, owner profiles, prompts, comandos, chat IDs, delivery targets, stdout/stderr, logs, raw outputs, rutas host o tokens.
- Añadir UI nueva o cambiar layout de `/healthcheck`.
- GitHub issue/PR counts o last-verify aggregation.

## Decisiones técnicas
- `cronjobs` sigue siendo una fuente agregada (`cronjobs.registry`), no una lista pública de jobs.
- El adapter no serializa detalles de jobs; solo produce estado, severidad, timestamp, resumen saneado, warning y freshness.
- `pass` requiere resultado agregado positivo y jobs completos con `last_status` positivo, `last_run_at` válido y `criticality` allowlisted.
- Jobs críticos con `last_run_at` por encima del umbral warn de cronjobs degradan el agregado a `stale` para que la UI no muestre salud silenciosa.
- Manifiesto vacío degrada a `not_configured`; esto es seguro si Franky aún no ha desplegado productor global.
- El productor queda como follow-up operativo separado para Franky + Chopper.

## Verify esperado
```bash
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
python -m py_compile apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py
npm run verify:healthcheck-source-policy
npm run verify:perimeter-policy
PYTHONPATH=. python -m pytest apps/api/tests -q
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
git diff --check
```

## Review requerido
Franky + Chopper.

- Franky: contrato operativo del manifiesto, umbrales 180/720 min, degradaciones y futuro productor.
- Chopper: no leakage de prompts/comandos/chat/logs/output, no consola host genérica y frontera backend intacta.

# Phase 15.6a closeout — Cronjobs manifest adapter

## Resultado
Phase 15.6a conectó la fuente `cronjobs` de Healthcheck a un reader backend fijo sobre `/srv/crew-core/runtime/healthcheck/cronjobs-status.json`.

## Cambios
- Añadido `CronjobsManifestAdapter` en `apps/api/src/modules/healthcheck/source_adapters.py`.
- `HealthcheckService` incorpora el snapshot de cronjobs en los registros por defecto, sustituyendo el fixture cuando exista manifiesto real o degradando explícitamente si falta.
- Tests añadidos para:
  - registry reciente con jobs críticos exitosos -> `pass`.
  - job crítico failed -> `fail`.
  - job crítico stale -> `stale`.
  - job parcial -> `warn`.
  - manifiesto ausente/ilegible/vacío -> `not_configured`/`unknown`.
  - no leakage de prompts, comandos, chat IDs, stdout/stderr, tokens o rutas host.
- Actualizados `docs/healthcheck-source-policy.md`, `docs/api-modules.md`, `docs/read-models.md` y `scripts/check-healthcheck-source-policy.mjs`.
- Añadidos artefactos OpenSpec de Phase 15.6a.

## Decisiones
- La fuente pública sigue siendo agregada (`cronjobs.registry`); no se exponen jobs individuales.
- El adapter consume solo semántica segura: manifest status/timestamp y por job `last_run_at`, `last_status`, `criticality`.
- `job names` y `owner_profile` pueden existir en el manifiesto operativo, pero no se serializan en el read model público.
- `cronjob list` del perfil Zoro no se usa como fuente global.
- Productor/runner del manifiesto queda fuera de alcance y debe ser follow-up operativo separado con Franky + Chopper.

## Verify
- RED inicial: `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` falló por ausencia de `CronjobsManifestAdapter`.
- GREEN dirigido: `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` → `47 passed`.
- `python -m py_compile apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py` → passed.
- `npm run verify:healthcheck-source-policy` → passed.
- `npm run verify:perimeter-policy` → passed.
- `PYTHONPATH=. python -m pytest apps/api/tests -q` → `79 passed`.
- `npm --prefix apps/web run typecheck` → passed.
- `npm --prefix apps/web run build` → passed.
- `git diff --check` → passed.

## Riesgos / follow-ups
- No existe todavía productor global de `cronjobs-status.json`; hasta que Franky lo cree, Healthcheck degradará `cronjobs` a `not_configured`, que es intencional y seguro.
- Phase 15.6b recomendada: productor/runner Franky-owned del manifiesto de cronjobs, con escritura atómica, permisos no públicos y sin prompts/comandos/logs en JSON.

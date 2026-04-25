# Phase 15.4a — Project health local adapter

## Objetivo
Conectar `project-health` como tercera fuente viva de Healthcheck mediante un adapter local y acotado, sin convertir Healthcheck en consola Git ni exponer internals del repositorio.

## Alcance
- Añadir `ProjectHealthManifestAdapter` en `apps/api/src/modules/healthcheck/source_adapters.py`.
- Leer solo un manifiesto fijo Zoro-owned: `/srv/crew-core/runtime/healthcheck/project-health-status.json`.
- Consumir únicamente semántica segura:
  - `status`/`result` allowlisted.
  - `updated_at` o `last_success_at` como timestamp parseable.
  - `workspace_clean`, `main_branch`, `remote_synced` como booleanos.
- Enrutar el resultado por `HealthcheckSourceRegistry` para conservar label backend-owned, allowlist de campos y saneado textual.
- Integrar el snapshot en el catálogo por defecto de `HealthcheckService`.
- Actualizar docs vivas y guardrail `verify:healthcheck-source-policy`.

## Fuera de alcance
- Ejecutar Git desde el backend.
- Exponer rama cruda, remotes, diffs, listas de untracked files, paths host o salidas Git.
- Conectar GitHub issue/PR counts.
- Agregar last-verify/status aggregation.
- Conectar gateways o cronjobs.
- Crear productor operativo del manifiesto; esta microfase solo consume el contrato fijo si existe.

## Decisiones técnicas
- Estado ausente -> `not_configured` vía registry.
- Manifiesto ilegible/no JSON/no mapping -> `unknown` vía registry.
- Timestamp ausente/ilegible -> `unknown` sin salida cruda.
- `pass` solo si hay resultado positivo explícito, booleanos completos y verdaderos, y frescura dentro de threshold.
- `workspace_clean=false`, `main_branch=false` o `remote_synced=false` degradan a `warn` sin detallar rama, remotos, diffs o ficheros.
- Threshold de `project-health`: warn 120 min, fail 480 min.

## Verify esperado
- `python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q`
- `python -m py_compile apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py`
- `npm run verify:healthcheck-source-policy`
- `git diff --check`
- scan dirigido de secretos/salidas host en el diff.

## Review requerido
Franky + Chopper.

- Franky: contrato operativo del manifiesto, semántica de frescura y degradaciones.
- Chopper: frontera host/Git, no leakage, ausencia de consola genérica.

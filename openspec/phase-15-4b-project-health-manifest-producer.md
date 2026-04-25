# Phase 15.4b — Project health manifest producer

## Objetivo
Cerrar el follow-up operativo de PR #39 / issue #41 creando un productor Zoro-owned para el manifiesto fijo `project-health-status.json`, sin ampliar la superficie backend de Healthcheck ni publicar internals Git.

## Alcance
- Añadir un script operativo explícito en `scripts/write-project-health-status.py`.
- Leer el estado local del repo mediante comandos Git acotados ejecutados fuera del backend Healthcheck.
- Escribir de forma atómica el manifiesto fijo `/srv/crew-core/runtime/healthcheck/project-health-status.json`.
- Crear el directorio padre con permisos mínimos razonables y dejar el fichero con permisos no públicos.
- Serializar solo JSON mínimo:
  - `status`/`result`.
  - `updated_at`.
  - `workspace_clean`.
  - `main_branch`.
  - `remote_synced`.
- Añadir tests del productor con Git repo temporal.
- Actualizar docs vivas y guardrail `verify:healthcheck-source-policy`.

## Fuera de alcance
- Cambiar `ProjectHealthManifestAdapter` o el read model público salvo documentación/guardrail.
- Escribir rama cruda, remotes, SHAs, diffs, untracked files, paths host, stdout/stderr o raw Git output en el manifiesto.
- Conectar GitHub issue/PR counts.
- Agregar last-verify/status aggregation.
- Ejecutar Git desde el backend Healthcheck.
- Instalar systemd/cron real; esta microfase deja el productor invocable y testeado, no una automatización persistente nueva.

## Decisiones técnicas
- `status/result = success` solo si el repo está limpio, en `main` y sincronizado con upstream remoto.
- Estados degradados (`dirty`, `diverged`, `warning`) pueden emitirse explícitamente por el productor; el adapter 15.4a ya los interpreta como `warn` sin leakage.
- Si no hay upstream o no puede resolverse la sincronización remota, `remote_synced=false` y el estado degrada a `diverged`/`warning`; no se escriben detalles.
- El productor puede devolver exit code no cero solo ante fallo operativo de escritura/lectura Git que impide producir un manifiesto válido; un repo dirty/not-main/not-synced produce manifiesto válido degradado.

## Verify esperado
- `python -m pytest apps/api/tests/test_project_health_manifest_producer.py apps/api/tests/test_healthcheck_dashboard_api.py -q`
- `python -m py_compile scripts/write-project-health-status.py apps/api/tests/test_project_health_manifest_producer.py`
- `npm run verify:healthcheck-source-policy`
- `git diff --check`
- scan dirigido del diff contra secretos/salidas host reales.

## Review requerido
Franky + Chopper.

- Franky: ejecución operativa, atomicidad, permisos, semántica de sincronización y degradaciones.
- Chopper: no leakage de Git/host, frontera backend intacta y ausencia de datos sensibles en manifiesto/docs.

# Phase 15.4b implementation closeout — project-health manifest producer

## Resultado
Phase 15.4b cierra el follow-up #41 creando un productor operativo Zoro-owned para el manifiesto seguro de `project-health`.

## Cambios
- `scripts/write-project-health-status.py`: nuevo productor explícito. Consulta Git local fuera del backend Healthcheck y escribe atómicamente `/srv/crew-core/runtime/healthcheck/project-health-status.json`.
- `package.json`: añade `npm run write:project-health-status` como entrypoint operativo.
- `apps/api/tests/test_project_health_manifest_producer.py`: tests TDD con repos Git temporales para success, dirty/not-main, unsynced y CLI.
- `scripts/check-healthcheck-source-policy.mjs`: guardrail ampliado para fijar productor, ruta fija, shape mínimo, escritura atómica y permisos.
- `docs/healthcheck-source-policy.md`, `docs/api-modules.md`, `docs/read-models.md`: documentación viva actualizada.
- `openspec/phase-15-4b-project-health-manifest-producer.md`: spec de alcance y verify.

## Límites conservados
- El backend Healthcheck sigue sin ejecutar Git, shell ni filesystem discovery genérico.
- El manifiesto serializa solo `status`, `result`, `updated_at`, `workspace_clean`, `main_branch`, `remote_synced`.
- No se escriben ramas crudas, remotes, SHAs, diffs, untracked files, paths host, stdout/stderr/raw output, GitHub counts ni last-verify detail.
- Gateway y cronjobs siguen fuera de alcance.

## Verify
Ejecutado en rama `zoro/phase-15-4b-project-health-manifest-producer`:
- `python -m pytest apps/api/tests/test_project_health_manifest_producer.py -q` -> 4 passed tras test rojo inicial por script inexistente.
- `npm run verify:healthcheck-source-policy` -> passed.
- `python -m pytest apps/api/tests/test_project_health_manifest_producer.py apps/api/tests/test_healthcheck_dashboard_api.py -q` -> 43 passed.
- `python -m py_compile scripts/write-project-health-status.py apps/api/tests/test_project_health_manifest_producer.py` -> OK.
- `git diff --check` -> OK.
- Scan dirigido del diff -> solo aparecen términos sensibles en docs/tests/guardrails como exclusiones o fixtures sintéticas; no hay secretos reales ni salidas host crudas.

## Riesgos / follow-ups
- Queda pendiente decidir instalación operativa persistente del productor (cron/systemd timer) si Franky quiere automatizar refresco periódico. Esta PR solo deja productor invocable, testeado y seguro.

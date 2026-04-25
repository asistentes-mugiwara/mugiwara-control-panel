# Phase 15.4a implementation closeout — project-health local adapter

## Resultado
Phase 15.4a implementa `ProjectHealthManifestAdapter` como adapter vivo acotado para `project-health`.

## Cambios
- `apps/api/src/modules/healthcheck/source_adapters.py`: nuevo adapter que lee el manifiesto fijo `/srv/crew-core/runtime/healthcheck/project-health-status.json` y reduce el contenido a semántica segura de estado/timestamp/booleanos.
- `apps/api/src/modules/healthcheck/service.py`: `HealthcheckService` incluye el snapshot de `project-health` en sus fuentes por defecto junto a `vault-sync` y `backup-health`.
- `apps/api/tests/test_healthcheck_dashboard_api.py`: tests TDD para pass seguro, estados locales degradados, contrato fail-closed, stale, missing/unreadable y no leakage.
- `docs/healthcheck-source-policy.md`, `docs/api-modules.md`, `docs/read-models.md`: documentación viva actualizada.
- `scripts/check-healthcheck-source-policy.mjs`: guardrail actualizado para fijar que 15.4a permite solo el manifest reader fijo y excluye GitHub counts/last-verify.

## Límites conservados
- No se ejecuta Git desde el backend.
- No se exponen remotes, ramas crudas, diffs, listas de untracked files, paths host, salidas Git, GitHub counts ni last-verify detail.
- Gateway y cronjobs siguen fuera de alcance.

## Verify
Ejecutado en rama `zoro/phase-15-4a-project-health-local-adapter`:
- `python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` -> 39 passed.
- `python -m py_compile apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py` -> OK.
- `npm run verify:healthcheck-source-policy` -> passed.
- `git diff --check` -> OK.
- Scan dirigido del diff: solo aparecen marcadores sintéticos de tests/docs (`token`, `.env`, `stdout`, `remote_url`, etc.) usados para verificar saneado; no hay secretos reales ni salidas host crudas.
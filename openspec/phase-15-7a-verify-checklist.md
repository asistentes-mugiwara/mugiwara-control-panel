# Phase 15.7a verify checklist — Cronjobs registry size limit

## TDD
- [x] Test rojo añadido para registry oversized antes de implementar el límite.
- [x] Test dirigido del productor pasa.

## Código
- [x] `scripts/write-cronjobs-status.py` comprueba tamaño antes de `json.loads`.
- [x] El error no incluye contenido, ruta ni secretos sintéticos.
- [x] No se escribe manifiesto cuando el registry excede el límite.
- [x] `verify:cronjobs-status-runner` fija el nuevo contrato.

## Docs / memoria
- [x] OpenSpec actualizado.
- [x] Docs vivas actualizadas: `docs/healthcheck-source-policy.md`, `docs/read-models.md`, `docs/api-modules.md`.
- [x] Closeout `.engram` escrito.
- [x] Engram remoto/local actualizado si procede.

## Verify final
- [x] `PYTHONPATH=. python -m pytest apps/api/tests/test_cronjobs_status_manifest_producer.py -q` → 4 passed.
- [x] `python -m py_compile scripts/write-cronjobs-status.py apps/api/tests/test_cronjobs_status_manifest_producer.py` → OK.
- [x] `npm run verify:cronjobs-status-runner` → OK.
- [x] `npm run verify:healthcheck-source-policy` → OK.
- [x] `npm run write:cronjobs-status` → wrote real manifest, shape/perms validated separately.
- [x] `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` → 47 passed.
- [x] `PYTHONPATH=. python -m pytest apps/api/tests -q` → 83 passed.
- [x] `npm --prefix apps/web run typecheck` → OK.
- [x] `npm --prefix apps/web run build` → OK.
- [x] `git diff --check` → OK.

## PR / review
- [x] Commit con trailers Mugiwara.
- [x] PR abierta.
- [x] Handoff Franky + Chopper completado.
- [x] Issue #58 cerrado o enlazado al merge.

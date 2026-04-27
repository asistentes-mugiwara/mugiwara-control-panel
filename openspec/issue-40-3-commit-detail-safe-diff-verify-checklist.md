# Issue #40.3 — Git commit detail + safe diff backend verify checklist

## Scope
- [x] `main` actualizado tras PR #90.
- [x] Rama creada: `zoro/issue-40-3-commit-detail-safe-diff`.
- [x] Rehidratados Issue #40, comentario de cierre 40.2/PR #90, OpenSpec, docs, guardrail, AGENTS y `.engram/issue-40-2-closeout.md`.
- [x] Decisión de corte: 40.3 no se divide más; commit detail + safe diff forman una unidad backend-only coherente, manteniendo fuera UI y working-tree diff.

## TDD
- [x] Tests rojos escritos primero en `apps/api/tests/test_git_control_api.py`.
- [x] Rojo observado: endpoints `/commits/{sha}` y `/commits/{sha}/diff` devolvían 404 y `GitReadAdapter.get_commit_detail` no existía.
- [x] Implementación añadida después del rojo.

## Implementación
- [x] Endpoint `GET /api/v1/git/repos/{repo_id}/commits/{sha}` añadido.
- [x] Endpoint `GET /api/v1/git/repos/{repo_id}/commits/{sha}/diff` añadido.
- [x] Cliente solo usa `repo_id` allowlisteado y SHA completo hex SHA-1/SHA-256; nunca paths, refs, rangos ni revspecs.
- [x] SHA inválido devuelve error saneado `git_invalid_sha` sin ecoar input.
- [x] Commit detail serializa metadata saneada, trailers allowlisteados y stats por fichero; no expone body libre del commit.
- [x] Diff de commit omite paths sensibles y binarios; redacta contenido con tokens/rutas host; trunca por fichero y total.
- [x] Payload de diff expone `truncated`, `redacted`, `omitted`, `omitted_reason` y `omitted_files_count` con razones genéricas.
- [x] Sin UI, sin working-tree diff y sin acciones Git destructivas/remotas.
- [x] Git usa `shell=False`, cwd fijo, timeout, env mínimo, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_SYSTEM=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`, `-c core.fsmonitor=false`, `-c core.hooksPath=/dev/null`, y `--no-ext-diff` para detail/diff.
- [x] Payload no serializa rutas host, remotes privados, stdout/stderr, stack traces, errores crudos ni cuerpo libre de commits.

## Guardrails/docs
- [x] Actualizado `npm run verify:git-control-backend-policy` para commit detail + diff.
- [x] Actualizados `docs/api-modules.md`, `docs/read-models.md`, `docs/runtime-config.md`.
- [x] Actualizado `apps/api/src/modules/git_control/AGENTS.md`.
- [x] Actualizado `openspec/issue-40-git-control-page-plan.md`.
- [x] Añadido `.engram/issue-40-3-closeout.md`.

## Verify requerido
- [x] `python3 -m py_compile apps/api/src/modules/git_control/domain.py apps/api/src/modules/git_control/git_adapter.py apps/api/src/modules/git_control/service.py apps/api/src/modules/git_control/router.py apps/api/tests/test_git_control_api.py`
- [x] `PYTHONPATH=. pytest apps/api/tests/test_git_control_api.py -q`
- [x] `npm run verify:git-control-backend-policy`
- [x] `npm run verify:perimeter-policy`
- [x] `git diff --check`

## Review esperado
- Franky: operabilidad, subprocess Git policy para `show`, timeout/cwd/env mínimo, `--no-ext-diff`, límites de diff y mantenibilidad del guardrail.
- Chopper: seguridad, validación estricta de SHA, no refs/revspecs cliente, omisión/redacción/truncado deny-by-default y no leakage.

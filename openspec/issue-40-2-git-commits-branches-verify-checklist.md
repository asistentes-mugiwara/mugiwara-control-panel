# Issue #40.2 — Git commits/branches backend verify checklist

## Scope
- [x] `main` actualizado antes de empezar.
- [x] Rama creada: `zoro/issue-40-2-git-commits-branches`.
- [x] Revisados PR #89, Issue #40, checklist 40.1, `.engram/issue-40-1-closeout.md`, docs API/read-models/runtime, guardrail `verify:git-control-backend-policy` y Project Summary del vault.
- [x] Confirmado que el Project Summary del vault ya fue actualizado tras 40.1.

## TDD
- [x] Tests rojos escritos primero en `apps/api/tests/test_git_control_api.py`.
- [x] Rojo observado: endpoints `/commits` y `/branches` devolvían 404 y `GitReadAdapter` no existía.
- [x] Implementación añadida después del rojo.

## Implementación
- [x] Endpoint `GET /api/v1/git/repos/{repo_id}/commits?limit=&cursor=` añadido.
- [x] Endpoint `GET /api/v1/git/repos/{repo_id}/branches` añadido.
- [x] Cliente solo usa `repo_id`; commits solo acepta `limit` y cursor opaco `offset:<n>`.
- [x] Límites inválidos y cursor/revspec malicioso devuelven error saneado sin ecoar input.
- [x] Commits serializan hashes, autor/email saneado, fechas, subject/body acotado y trailers `Mugiwara-Agent`/`Signed-off-by`.
- [x] Branches serializa únicamente ramas locales saneadas; sin remotes, refs arbitrarias ni discovery.
- [x] Sin UI, sin diffs, sin working tree diff y sin commit detail por SHA.
- [x] Sin checkout/reset/commit/push/pull/fetch/stash/merge/rebase.
- [x] Git usa `shell=False`, cwd fijo, timeout, env mínimo, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_SYSTEM=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`, `-c core.fsmonitor=false`, `-c core.hooksPath=/dev/null`.
- [x] Payload no serializa rutas host, remotes privados, stdout/stderr, stack traces ni errores crudos.
- [x] Repos desconocidos o ilegibles degradan con errores/payload saneados.

## Guardrails/docs
- [x] Actualizado `npm run verify:git-control-backend-policy` para status/commits/branches.
- [x] Actualizados `docs/api-modules.md`, `docs/read-models.md`, `docs/runtime-config.md`.
- [x] Actualizado `apps/api/src/modules/git_control/AGENTS.md`.
- [x] Actualizado `openspec/issue-40-git-control-page-plan.md`.
- [x] Añadido `.engram/issue-40-2-closeout.md`.

## Verify requerido
- [x] `PYTHONPATH=. pytest apps/api/tests/test_git_control_api.py -q`
- [x] `npm run verify:git-control-backend-policy`
- [x] `npm run verify:perimeter-policy`
- [x] `git diff --check`

## Review esperado
- Franky: operabilidad, subprocess Git policy para `log`/`branch`, timeout/cwd/env mínimo, no red en request y mantenibilidad del guardrail.
- Chopper: seguridad, allowlist, validación estricta de cursor/límites, no leakage, no refs/revspecs cliente y errores saneados.

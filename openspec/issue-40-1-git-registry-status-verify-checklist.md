# Issue #40.1 — Git registry/status backend verify checklist

## Scope
- [x] `main` actualizado antes de empezar.
- [x] Rama creada: `zoro/issue-40-1-git-registry-status`.
- [x] PR #88 revisada, incluyendo comentarios de Franky/Chopper/Usopp.
- [x] Revisados `openspec/issue-40-git-control-page-plan.md`, checklist de planificación, `.engram/issue-40-planning-closeout.md`, docs API/read-models/runtime y guardrails existentes.

## TDD
- [x] Tests rojos escritos primero en `apps/api/tests/test_git_control_api.py`.
- [x] Rojo observado: `ModuleNotFoundError: No module named 'apps.api.src.modules.git_control'`.
- [x] Implementación añadida después del rojo.

## Implementación
- [x] Módulo backend `apps/api/src/modules/git_control/` creado.
- [x] Registry backend-owned y allowlisteada con `repo_id` lógico.
- [x] Endpoint `GET /api/v1/git/repos` añadido.
- [x] Endpoint `GET /api/v1/git/repos/{repo_id}/status` añadido.
- [x] Cliente solo usa `repo_id`; no hay parámetros path/url/remote/command/ref/revspec.
- [x] Status Git usa `subprocess.run` con lista de args, `shell=False`, `cwd` fijo, timeout, env mínimo y comando read-only allowlisteado.
- [x] Sin diffs, sin UI, sin endpoints de commits/branches detail.
- [x] Sin checkout/reset/commit/push/pull/fetch/stash/merge/rebase.
- [x] Payload no serializa rutas host, nombres de fichero, remotes, stdout/stderr, stack traces ni errores crudos.
- [x] Repos desconocidos o ilegibles degradan con errores saneados.

## Guardrails/docs
- [x] Añadido `npm run verify:git-control-backend-policy`.
- [x] Actualizados `docs/api-modules.md`, `docs/read-models.md`, `docs/runtime-config.md`.
- [x] Actualizado `apps/api/src/modules/AGENTS.md` y añadido `apps/api/src/modules/git_control/AGENTS.md`.
- [x] Añadido `.engram/issue-40-1-closeout.md`.

## Verify requerido
- [x] `PYTHONPATH=. pytest apps/api/tests/test_git_control_api.py -q`
- [x] `npm run verify:git-control-backend-policy`
- [x] `npm run verify:perimeter-policy`
- [x] `git diff --check`

## Review esperado
- Franky: operabilidad, subprocess Git policy, timeout/cwd/env mínimo, no red en request y mantenibilidad del guardrail.
- Chopper: seguridad, allowlist, no discovery, no leakage, no paths cliente y errores saneados.

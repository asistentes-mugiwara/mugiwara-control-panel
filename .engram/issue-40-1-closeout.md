# Issue #40.1 closeout — Git registry/status backend

## Resultado
Se implementó la microfase 40.1 backend-only para Git control: registry allowlisteada de repos Git locales y endpoints read-only de índice/status.

## Artefactos
- `apps/api/src/modules/git_control/`
- `apps/api/tests/test_git_control_api.py`
- `scripts/check-git-control-backend-policy.mjs`
- `docs/api-modules.md`
- `docs/read-models.md`
- `docs/runtime-config.md`
- `openspec/issue-40-1-git-registry-status-verify-checklist.md`

## Decisiones técnicas
- El cliente opera solo con `repo_id`; la ruta real vive únicamente en la registry backend-owned.
- 40.1 serializa solo status summary: `source_state`, `working_tree`, conteos y branch saneada.
- No se implementan commits, branches detail, diffs, UI ni acciones Git.
- Git se invoca solo para `status --porcelain=v1 --branch --untracked-files=all --no-renames` con `subprocess.run`, `shell=False`, `cwd` fijo, timeout y env mínimo.
- Repos desconocidos devuelven 404 saneado sin eco de input; repos ilegibles/no Git degradan a `source_unavailable` sin filtrar path/stdout/stderr.
- El guardrail `verify:git-control-backend-policy` fija la frontera para evitar deriva hacia consola Git o browser de filesystem.

## Verify
Ejecutado al cierre:
- `PYTHONPATH=. pytest apps/api/tests/test_git_control_api.py -q` — pasa.
- `npm run verify:git-control-backend-policy` — pasa.
- `npm run verify:perimeter-policy` — pasa.
- `git diff --check` — pasa.

## Review requerido
- Franky + Chopper en PR de implementación.
- Franky debe validar operabilidad y política de subprocess Git.
- Chopper debe validar allowlist, no leakage, no paths cliente y frontera host.

## Continuidad
Siguiente microfase de #40 recomendada: 40.2 backend commits + branches read model, manteniendo `repo_id` allowlisteado, validación estrecha de SHA/cursor y sin diffs hasta 40.3.

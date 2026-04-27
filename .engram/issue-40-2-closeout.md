# Issue #40.2 closeout — Git commits/branches backend

## Resultado
Se implementó la microfase 40.2 backend-only para Git control: endpoints read-only de commits recientes y ramas locales sobre la registry allowlisteada existente de 40.1.

## Artefactos
- `apps/api/src/modules/git_control/`
- `apps/api/tests/test_git_control_api.py`
- `scripts/check-git-control-backend-policy.mjs`
- `docs/api-modules.md`
- `docs/read-models.md`
- `docs/runtime-config.md`
- `openspec/issue-40-2-git-commits-branches-verify-checklist.md`

## Decisiones técnicas
- El cliente sigue operando solo con `repo_id`; no hay paths, URLs, remotes, comandos, refs, branch selector ni revspecs desde cliente.
- `GET /api/v1/git/repos/{repo_id}/commits` acepta `limit` `1..50` y cursor opaco `offset:<n>` generado por backend. No acepta SHAs ni revsets como cursor.
- `GET /api/v1/git/repos/{repo_id}/branches` lista solo ramas locales mediante formato fijo de Git; no lista remotes.
- Commits exponen metadata acotada y trailers `Mugiwara-Agent`/`Signed-off-by`; no exponen diffs, nombres de ficheros ni cuerpo libre del commit.
- Git amplía la allowlist read-only a `status`, `log` y `branch`, manteniendo hardening de 40.1: `shell=False`, cwd fijo, timeout, env mínimo, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_SYSTEM=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`, `-c core.fsmonitor=false`, `-c core.hooksPath=/dev/null`.
- Repos desconocidos, no Git o ilegibles degradan con payload saneado y sin filtrar rutas/stdout/stderr.

## Verify
Ejecutado al cierre:
- `PYTHONPATH=. pytest apps/api/tests/test_git_control_api.py -q` — pasa (`11 passed`).
- `npm run verify:git-control-backend-policy` — pasa.
- `npm run verify:perimeter-policy` — pasa.
- `git diff --check` — pasa.

## Review requerido
- Franky + Chopper en PR de implementación.
- Franky debe validar operabilidad de `git log`/`git branch`, timeout/cwd/env, no red y guardrail.
- Chopper debe validar seguridad de cursor/límites, no refs/revspecs cliente, no leakage y frontera host.

## Continuidad
Siguiente microfase de #40 recomendada: 40.3 backend commit detail + safe diff, con redacción/omisión/truncado deny-by-default y nueva revisión Franky + Chopper. No reutilizar la aprobación de 40.2 para diffs.

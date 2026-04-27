# Issue #40.3 closeout — commit detail + safe diff backend

## Resultado
Microfase backend-only 40.3 implementada en rama `zoro/issue-40-3-commit-detail-safe-diff`.

## Alcance decidido
No se dividió más: commit detail y safe diff comparten validación de SHA, lectura `git show`, stats por fichero y política de saneado. Quedan fuera UI, working-tree diff, refs/rangos arbitrarios y cualquier acción Git destructiva/remota.

## Decisiones técnicas
- El cliente solo puede enviar `repo_id` allowlisteado y SHA completo hex SHA-1/SHA-256 devuelto por el backend.
- El cuerpo libre del commit sigue sin ser público; `%B` se usa solo internamente para trailers `Mugiwara-Agent` y `Signed-off-by`.
- `git show` se permite como subcomando read-only bajo hardening 40.1: `shell=False`, cwd fijo, timeout, env mínimo, `GIT_CONFIG_*`, `core.fsmonitor=false`, `core.hooksPath=/dev/null` y `--no-ext-diff`.
- Los diffs omiten paths sensibles y binarios, redactan tokens/rutas host en líneas permitidas y truncan por fichero/total con indicadores explícitos.

## Verify
- `python3 -m py_compile ...` módulos Git control + tests.
- `PYTHONPATH=. pytest apps/api/tests/test_git_control_api.py -q` -> 17 passed.
- `npm run verify:git-control-backend-policy` -> passed.
- `npm run verify:perimeter-policy` -> passed.
- `git diff --check` -> OK.

## Riesgos/follow-ups
- 40.4 puede consumir estos endpoints desde UI server-only; debe mantener copy visible de solo lectura/redacción/truncado.
- 40.5 working-tree diff sigue siendo más sensible que commit history y debe tratarse como microfase propia, probablemente summary-first.

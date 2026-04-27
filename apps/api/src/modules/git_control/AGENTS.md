# AGENTS.md — apps/api/src/modules/git_control

## Rol
Módulo backend read-only para consultar repositorios Git locales allowlisteados.

## Reglas
- El cliente solo puede enviar `repo_id`; nunca paths, URLs, remotes, comandos ni revspecs.
- La registry es backend-owned, explícita y deny-by-default.
- Sin discovery arbitrario de filesystem ni selección dinámica de repos desde request.
- Sin acciones Git destructivas o remotas: no checkout/reset/commit/push/pull/fetch/stash/merge/rebase.
- Si se invoca Git, usar `subprocess.run` con lista de argumentos, `shell=False`, `cwd` fijo, timeout y entorno mínimo.
- Serializar solo estado resumido, commits recientes y ramas locales: clean/dirty, conteos, rama actual saneada, hashes/fechas/autores saneados y trailers `Mugiwara-Agent`/`Signed-off-by`. Sin diffs, filenames de status, rutas host, remotes, stdout/stderr, stack traces ni errores crudos.
- Para commits, aceptar solo `limit` `1..50` y cursor opaco `offset:<n>` generado por backend; no aceptar SHA/ref/revspec cliente ni revsets arbitrarios.
- Degradar repos ausentes, corruptos o ilegibles a estados explícitos y saneados.

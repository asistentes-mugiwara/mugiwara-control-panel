# AGENTS.md — apps/api/src/modules/git_control

## Rol
Módulo backend read-only para consultar repositorios Git locales allowlisteados.

## Reglas
- El cliente solo puede enviar `repo_id`; nunca paths, URLs, remotes, comandos ni revspecs.
- La registry es backend-owned, explícita y deny-by-default.
- Sin discovery arbitrario de filesystem ni selección dinámica de repos desde request.
- Sin acciones Git destructivas o remotas: no checkout/reset/commit/push/pull/fetch/stash/merge/rebase.
- Si se invoca Git, usar `subprocess.run` con lista de argumentos, `shell=False`, `cwd` fijo, timeout y entorno mínimo.
- Serializar solo estado resumido: clean/dirty, conteos y rama actual saneada. Sin diffs, filenames, rutas host, remotes, stdout/stderr, stack traces ni errores crudos.
- Degradar repos ausentes, corruptos o ilegibles a estados explícitos y saneados.

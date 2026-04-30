# AGENTS.md — apps/web/src/modules/git

## Rol
Módulo frontend read-only para la página `/git` (`Repos Git`), actualmente orientada a revisar estado local de repositorios Git allowlisteados mediante una card por repo.

## Reglas
- El adapter HTTP debe ser `server-only` y usar únicamente `MUGIWARA_CONTROL_PANEL_API_URL` en servidor.
- El cliente/UI solo puede operar con `repo_id` y datos devueltos por backend; no paths, refs, rangos, revspecs ni discovery arbitrario.
- No introducir acciones Git: checkout/reset/commit/push/pull/fetch/stash/merge/rebase.
- La UI actual no muestra working-tree diff ni diff histórico; muestra rama actual, ramas disponibles, conteos de cambios/sin trackear y último commit.
- No renderizar backend URL, rutas host, stdout/stderr, stack traces, errores crudos, cuerpo libre de commits ni paths omitidos por seguridad.
- La UI debe mostrar claramente modo solo lectura y que el mensaje desplegado del último commit está limitado al asunto saneado del resumen backend.

Nota guardrail: sin paths cliente ni paths host renderizados.

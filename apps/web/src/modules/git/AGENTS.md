# AGENTS.md — apps/web/src/modules/git

## Rol
Módulo frontend read-only para la página `/git` (`Repos Git`).

## Reglas
- El adapter HTTP debe ser `server-only` y usar únicamente `MUGIWARA_CONTROL_PANEL_API_URL` en servidor.
- El cliente/UI solo puede operar con `repo_id` y SHA completo devueltos por backend; no paths, refs, rangos, revspecs ni discovery arbitrario. En 40.5, la `Selección controlada` acepta `searchParams.repo_id` solo si existe en `repoIndex.repos` y `searchParams.sha` solo si existe en `commits.commits` del repo seleccionado.
- No introducir acciones Git: checkout/reset/commit/push/pull/fetch/stash/merge/rebase.
- 40.4 no muestra working-tree diff; solo índice, commits, ramas, detalle y diff histórico ya saneado por backend.
- No renderizar backend URL, rutas host, stdout/stderr, stack traces, errores crudos, cuerpo libre de commits ni paths omitidos por seguridad.
- La UI debe mostrar claramente modo solo lectura, redacción, truncado y omisión de diff.

Nota guardrail: sin paths cliente ni paths host renderizados.

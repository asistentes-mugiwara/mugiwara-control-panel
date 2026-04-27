# Issue #40.5 planning closeout — Git controlled selector (`Repos Git`)

## Contexto
Tras mergear PR #92, `/git` existe como página server-only/read-only pero selecciona automáticamente el primer repo y primer commit devueltos por backend.

Pablo pidió planificar 40.5 y decidir primero cómo dividirlo. La decisión técnica es no dividir 40.5 en varias PRs salvo que aparezca necesidad de backend nuevo o superficie Git adicional.

## Decisión
40.5 será una microfase única de frontend server-only para `Selección controlada` de repo/commit.

Corte interno:
1. contrato server-side de `searchParams` saneados;
2. UI con enlaces controlados para repos y commits;
3. guardrail/smokes/canon mínimo.

## Restricciones clave
- `repo_id` solo se acepta si está en `repoIndex.repos`.
- `sha` solo se acepta si está en `commits.commits` del repo seleccionado.
- Nunca llamar detail/diff con SHA no listado por backend en esa renderización.
- No paths cliente, refs, rangos, revspecs, branches arbitrarias, remotes, URLs, comandos, búsqueda libre ni acciones Git.
- No renderizar líneas de diff en HTML/DOM.

## Verify esperado
- `npm run verify:git-server-only`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:visual-baseline`
- `git diff --check`
- smoke HTML/DOM con query válida e inválida
- browser smoke `/git`

## Implementación 40.5
- `/git` lee `searchParams` en Server Component y valida `repo_id` contra `repoIndex.repos`.
- La página carga commits/branches solo del repo seleccionado saneado.
- `sha` se acepta solo si existe en `commits.commits` del repo seleccionado; detail/diff solo se invocan con ese SHA validado.
- Repo cards y commits son enlaces server-side; no se añadieron inputs, forms, búsqueda libre, refs/rangos/revspecs, acciones Git, working-tree diff ni client-side fetch.
- Para evitar eco de query maliciosa en HTML/RSC, parámetros no soportados o `repo_id`/`sha` inválidos se redirigen a URL canónica saneada antes de renderizar la página final.
- Tras review de Chopper, la canonicalización se extendió también a fallback/degradación: con API no disponible, cualquier `repo_id`/`sha` o clave no soportada redirige a `/git` antes de renderizar fallback, evitando reflejo de query maliciosa en `__next_f`.

## Review
Usopp + Chopper. Franky solo si se introduce backend/runtime/cache/polling o endpoint nuevo.

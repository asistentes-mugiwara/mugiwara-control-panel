# Issue #40.5 planning closeout — Git controlled selector

## Contexto
Tras mergear PR #92, `/git` existe como página server-only/read-only pero selecciona automáticamente el primer repo y primer commit devueltos por backend.

Pablo pidió planificar 40.5 y decidir primero cómo dividirlo. La decisión técnica es no dividir 40.5 en varias PRs salvo que aparezca necesidad de backend nuevo o superficie Git adicional.

## Decisión
40.5 será una microfase única de frontend server-only para selector controlado de repo/commit.

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

## Review
Usopp + Chopper. Franky solo si se introduce backend/runtime/cache/polling o endpoint nuevo.

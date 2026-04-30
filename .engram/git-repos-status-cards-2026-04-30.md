# Git repos status cards — 2026-04-30

## Objetivo
Reorientar `/git` desde una página de historial/diff poco útil para Pablo a un revisor de estado de repos Git locales.

## Cambio
- `/git` renderiza una card por repo allowlisteado.
- Cada card muestra rama actual, ramas disponibles, conteo de cambios, conteo no trackeado y último commit con fecha/hora.
- El último commit usa `<details>` y un cuadro `pre` para desplegar el mensaje saneado.
- Por seguridad, el cuadro renderiza solo `commit.subject` del resumen backend; el cuerpo libre de commit sigue sin publicarse.
- La página sigue siendo server-only y read-only: sin inputs, sin refs/rangos/revspecs, sin acciones Git, sin rutas host y sin diffs en la UI actual.

## Verify esperado
- `npm run verify:git-server-only`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`
- smoke visual/HTML de `/git` contra producción o servidor local antes de merge/despliegue.

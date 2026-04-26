# Phase 16.5 closeout — Skills not-configured UX (#46)

## Contexto
Issue #46 venía de revisión UX de Usopp: `/skills` en estado `not_configured` parecía un editor productivo vacío y repetía el mismo problema raíz en varias zonas.

## Decisión de fase
Se ejecutó como microfase única, no se dividió más. La frontera era homogénea y UI-only: una ruta Skills, copy/jerarquía de estados y docs. No toca backend, BFF, runtime config, seguridad efectiva, dependencias ni escritura nueva.

## Cambios cerrados
- Se añadió un panel superior dominante `Acción requerida` para `not_configured`/error raíz.
- El workspace pasa a `Workspace bloqueado` y deja de pedir selección cuando no hay catálogo real.
- Catálogo, editor y preview/auditoría mantienen estructura secundaria con copy bloqueado sin repetir todo el diagnóstico raíz.
- Se mantienen frontera BFF, edición allowlisted y auditoría como contexto visible.
- Se actualizaron `docs/frontend-states.md` y `docs/frontend-ui-spec.md`.

## Verify
- `npm --prefix apps/web run typecheck` — OK.
- `npm --prefix apps/web run build` — OK.
- `npm run verify:visual-baseline` — OK, checklist incluye `/skills`.
- `git diff --check` — OK.
- Browser smoke `/skills` en `not_configured` — panel raíz dominante, workspace bloqueado, sin overflow evidente; consola sin errores JS, con 503 esperados de BFF no configurado.
- Ronda Usopp 1 pidió cambios: reducir peso repetido en `Estado del origen` y corregir overflow interno en desktop medio. Se resolvió compactando esa tarjeta como contexto BFF secundario y verificando DOM sin `article` con `scrollWidth > clientWidth`.

## Continuidad
Reviewer esperado: Usopp. Chopper no es necesario en esta microfase porque no cambió plumbing de errores, runtime config, BFF ni superficie de seguridad.

## Pendiente externo
Tras merge, cerrar GitHub #46 y actualizar el Project Summary del vault retirando #46 de follow-ups.

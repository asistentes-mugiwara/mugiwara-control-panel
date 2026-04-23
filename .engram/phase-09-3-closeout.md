# Phase 9.3 closeout — skills diff preview affordances

## Resultado
- `skills` añade affordances explícitos de edición controlada sobre las skills allowlisted.
- Se incorporó cliente frontend para preview de diff en `apps/web/src/modules/skills/api/skills-http.ts`.
- La página `apps/web/src/app/skills/page.tsx` ahora muestra:
  - borrador editable solo en skills permitidas
  - botón de preview de diff
  - botón de reset de borrador
  - preview real del diff devuelto por backend
  - mensaje explícito de que el guardado final sigue fuera de esta fase
- Las skills read-only siguen visibles, pero sin affordances activas de edición.

## Verify ejecutado
- `python -m pytest apps/api/tests -q` ✅
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `git diff --check` ✅

## Riesgos abiertos
- el preview depende de `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` y de backend accesible.
- todavía no existe guardado final en UI ni control de actor/fingerprint visible al usuario como flujo completo.
- el diff preview es textual y sobrio; aún no hay layout más rico ni confirmación final de escritura.

## Siguiente paso recomendado
- 9.4 — guardado controlado en frontend con actor, conflicto de fingerprint y cierre completo del flujo de edición permitida.

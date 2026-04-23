# Phase 9.4 closeout — skills controlled save

## Resultado
- `skills` cierra el flujo del MVP para edición permitida sobre skills allowlisted.
- Se añadió manejo frontend de errores estructurados en `apps/web/src/modules/skills/api/skills-http.ts` con soporte para `PUT` y código de error.
- La página `apps/web/src/app/skills/page.tsx` ahora muestra:
  - actor visible y editable antes del guardado
  - botón de guardado real contra backend
  - estado de operación (`idle`, `saving`, `success`, `stale`, `error`)
  - feedback explícito de conflicto por fingerprint
  - acción de recarga controlada desde backend
  - auditoría resumida enlazada con el último guardado
- Las skills read-only siguen visibles, pero fuera del flujo de escritura.

## Verify ejecutado
- `python -m pytest apps/api/tests -q` ✅
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `git diff --check` ✅

## Riesgos abiertos
- el guardado sigue dependiendo de `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` y de backend accesible.
- no hay todavía harness de UI automatizado para simular el conflicto `stale` desde navegador; la garantía actual viene del contrato backend y del typecheck/build frontend.
- el flujo muestra conflicto y recarga, pero aún no preserva ni compara visualmente el borrador local frente a la versión remota tras `stale`.

## Siguiente paso recomendado
- 9.5 — memory con selector de Mugiwara, tabs Built-in/Honcho y estado de fuente.

# Phase 8.6 closeout — skills readonly + edit boundary

## Resultado
- `skills` ya no es un placeholder simple: ahora representa una superficie read-only con frontera explícita de edición permitida.
- Se añadieron artefactos tipados en:
  - `apps/web/src/modules/skills/view-models/skill-surface.fixture.ts`
  - `apps/web/src/modules/skills/view-models/skill-surface.mappers.ts`
- La página `apps/web/src/app/skills/page.tsx` ahora muestra:
  - reglas de frontera deny-by-default
  - auditoría mínima exigida
  - patrones denegados
  - cards de skills con exposición `allowlisted-edit` o `read-only-reference`
- No se abrió edición real, ni detalle por ruta, ni fetch, ni backend.

## Verify ejecutado
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `git diff --check` ✅
- sin backend real, sin formularios y sin nueva ruta detalle ✅

## Método / runtime
- La microfase se resolvió inline desde Hermes sobre el repo ya estabilizado.
- Se mantuvo el método del proyecto: cambio acotado, view-model tipado y verify real antes de cierre.

## Riesgos abiertos
- Los datos siguen siendo fixtures frontend y no contratos reales de backend.
- La allowlist editable, auditoría persistente y diff real siguen pendientes de implementación backend.
- `skills` ya deja clara la frontera, pero todavía no ejerce el flujo productivo de guardado.

## Siguiente paso recomendado
- decidir si la siguiente fase entra en backend real de `skills` o en cierre de mayor fidelidad UI/contratos compartidos

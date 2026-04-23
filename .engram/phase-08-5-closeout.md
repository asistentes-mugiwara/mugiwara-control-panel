# Phase 8.5 closeout — mugiwaras readonly

## Resultado
- `mugiwaras` ya no es un placeholder simple: ahora representa `mugiwara.card[]` con identidad, estado, skills enlazadas, memory badge y links permitidos.
- Se añadieron artefactos tipados en:
  - `apps/web/src/modules/mugiwaras/view-models/mugiwara-card.fixture.ts`
  - `apps/web/src/modules/mugiwaras/view-models/mugiwara-card.mappers.ts`
- La página `apps/web/src/app/mugiwaras/page.tsx` sigue siendo delgada y read-only, apoyada en los primitives del shell.
- No se abrió detalle `mugiwaras/[slug]`, ni backend real, ni edición.

## Verify ejecutado
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- sin backend real, sin fetch y sin nueva ruta detalle ✅
- `.gitignore` sigue cubriendo artefactos frontend ✅

## Método / runtime
- La microfase se trabajó en la misma sesión SDD.
- OpenCode la rescató inline directamente con alcance corto, materializó el cambio y ejecutó verify real (`typecheck` + `build`).
- Se cierra fuera de OpenCode con trazabilidad documental y commit normal del repo.

## Riesgos abiertos
- Los datos siguen siendo fixtures frontend, no lecturas reales del backend.
- La capa visual aún no incorpora toda la fidelidad temática declarada por Usopp (por ejemplo identidad visual Mugiwara más rica o timestamp real en topbar).
- La siguiente frontera relevante ya no es otra tarjeta placeholder, sino empezar a decidir entre `skills` o backend real.

## Siguiente paso recomendado
- `phase-8-6-skills-readonly-edit-boundary`

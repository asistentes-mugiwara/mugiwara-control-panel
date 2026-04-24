# Phase 12.2 followups closeout — pending verify

## Resultado esperado
- Cerrar followups menores aceptados tras PR #3 antes de Phase 12.3.
- Mejorar foco visible del visor AGENTS.
- Reforzar affordance de scroll interno.
- Sustituir `Crests activos` por `Emblemas activos`.

## Decisión técnica
La siguiente unidad no será Phase 12.3 todavía. Primero se cierra esta microfase pequeña porque reduce deuda visual/accesibilidad y no toca la frontera backend ni seguridad.

## Riesgos
- Bajo: CSS global de foco se amplía a elementos focusables por `tabindex`, excluyendo `tabindex="-1"` para no afectar el skip target programático del shell.
- La scrollbar estilizada es puramente visual; no cambia datos ni contrato.

## Verify ejecutado
- `npm --prefix apps/web run typecheck` → OK.
- `npm --prefix apps/web run build` → OK.
- `git diff --check` → OK.

## Verify pendiente
- `git status --short --branch` antes de commit.
- PR con revisión de Usopp.

# Phase 16.5 verify checklist — Skills not-configured UX

## Scope check
- [x] Issue #46 leída desde GitHub.
- [x] Superficie acotada a `/skills` UI/copy + docs.
- [x] Decisión explícita: no dividir más; microfase única.
- [x] Sin backend/API/runtime/dependencias nuevas.

## Implementation check
- [x] Panel raíz dominante para `not_configured`/error.
- [x] Workspace no pide seleccionar skill cuando no hay catálogo.
- [x] Catálogo/editor/preview reducen duplicación del mensaje raíz.
- [x] Frontera de edición y estado de origen permanecen visibles como contexto secundario.
- [x] Docs frontend actualizadas.

## Verify commands
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] `npm run verify:visual-baseline`
- [x] `git diff --check`

## Review/closeout
- [ ] PR con handoff a Usopp.
- [ ] Issue #46 enlazada/cerrada tras merge.
- [x] `.engram/phase-16-5-skills-not-configured-ux-closeout.md` actualizado.
- [ ] Project Summary/vault actualizado si cambia el roadmap canónico.

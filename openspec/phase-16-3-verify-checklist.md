# Phase 16.3 verify checklist — StatePanel ARIA semantics (#48)

## Scope guard
- [x] Frontend accessibility semantics only.
- [x] No backend/API/read-model expansion.
- [x] No runtime config changes.
- [x] No dependency changes.
- [x] No broad visual redesign.

## Acceptance
- [x] Static empty/fallback panels are not all exposed as `role="status"` by default.
- [x] Loading/dynamic updates can still opt into `ariaRole="status"`.
- [x] Urgent/action-required panels can opt into `ariaRole="alert"`.
- [x] Named non-live panels can opt into `region`/`group` with `ariaLabel`.
- [x] Healthcheck priority notice has explicit alert/region semantics.

## Verify ejecutado
- [x] `npm run verify:statepanel-aria`
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] `npm run verify:visual-baseline`
- [x] Browser smoke `/healthcheck`: HTTP 200, console limpia, `role="status"` count 0, priority notice `role="alert"` + `aria-live="assertive"`.
- [x] `git diff --check`

## Review esperado
- Usopp: UI/accessibility semantics and visual no-regression.

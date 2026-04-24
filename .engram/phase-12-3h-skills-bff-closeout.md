# Phase 12.3h closeout — Skills BFF/server-only implementation

## Goal
Implement the `/skills` BFF/server-only migration approved in Phase 12.3g.

## Completed
- Added same-origin Next route handlers under `/api/control-panel/skills/**`.
- Added server-only upstream adapter using `MUGIWARA_CONTROL_PANEL_API_URL`.
- Added BFF validation for `skillId`, `Content-Type`, body size, preview payload and update payload.
- Refactored browser skills adapter to same-origin endpoints only.
- Removed browser-visible backend base URL copy from `/skills`.
- Added `npm run verify:skills-server-only`.
- Updated `README.md`, `docs/runtime-config.md` and `openspec/phase-12-3h-skills-bff-implementation.md`.

## Verify
- `npm run verify:skills-server-only` OK.
- `npm run verify:memory-server-only` OK.
- `npm run verify:mugiwaras-server-only` OK.
- `npm --prefix apps/web run typecheck` OK.
- `npm --prefix apps/web run build` OK.
- Backend regression `15 passed`.
- Smoke local:
  - `/api/control-panel/skills` returns catalog via BFF with valid server env.
  - `/api/control-panel/skills/{skillId}` returns detail via BFF.
  - `/api/control-panel/skills/{skillId}/preview` returns diff preview via BFF without persisting writes.
  - invalid `skillId` returns 400 sanitized.
  - wrong `Content-Type` returns 415 sanitized.
  - missing/invalid `MUGIWARA_CONTROL_PANEL_API_URL` returns 503 `not_configured` sanitized.
  - `/skills` renders through BFF with clean browser console.

## Notes
- Preview smoke used a non-persisting diff. Update smoke was intentionally not run against real allowlisted skills to avoid modifying production skill files without a fixture/restore workflow.
- Chopper asked for a minor followup documenting that `/api/control-panel/skills/**`, especially `PUT`, must remain behind Tailscale/private-auth perimeter unless future auth/rate-limit is added; this was added to runtime docs and OpenSpec before merge.
- One stale `.next` dev-server state caused an initial `/skills` 500 after route changes; removing `apps/web/.next` and restarting dev server resolved it. Build/typecheck were already clean.

## Review needed
- Chopper for endpoint/input/security boundary.
- Franky for runtime/route-handler/no-store/guardrail operation.

# Phase 12.6c closeout — Block closeout and canon refresh

## Goal
Close Phase 12 after the integration smoke/visual baseline slice and refresh the canonical project summary so the next session starts from the real backend/server-only state.

## Completed in this branch
- Added `openspec/phase-12-6c-block-closeout-canon.md` to define Phase 12 block outcome, remaining issues and review routing.
- Added `openspec/phase-12-6c-verify-checklist.md` to track closeout verification.
- Refreshed `/srv/crew-core/vault/03-Projects/Project Summary - Mugiwara Control Panel.md` from stale Phase 12.3a status to Phase 12.6c/Phase 12 closed state.
- Reviewed open GitHub issues #16 and #17 and kept both open intentionally as future tracks rather than pretending Phase 12 closed them.

## Phase 12 state after closeout
- `mugiwaras`, `memory`, `vault`, `dashboard` and `healthcheck` are now backend-owned read-only surfaces with server-only frontend config.
- `skills` remains the only MVP write surface and uses the same-origin BFF boundary for browser interactions.
- Runtime config is private through `MUGIWARA_CONTROL_PANEL_API_URL`; no `NEXT_PUBLIC_*` backend URL is used for Phase 12 surfaces.
- Healthcheck is still a safe catalog/fallback surface, not a live host command/log reader.
- Vault is read-only, allowlisted and traversal/symlink guarded.

## Verification basis
- Phase 12.6b is the runtime evidence for this closeout: all guardrails, typecheck, production build, full Phase 12 backend regression, API/web smoke, browser console and visual baseline passed.
- Phase 12.6c itself is documentation/canon-only and should be verified with diff review, `git diff --check`, repo status and PR review.

## Open follow-ups
- #16 remains open for future Healthcheck/Dashboard hardening: explicit timestamp parsing when real sources are connected, real `critical` severity aggregation and possible backend host allowlist.
- #17 remains open for the existing Next/PostCSS moderate advisory audit; do not solve it inside closeout.
- Future block should decide between auth/perimeter hardening, real health sources or dependency maintenance as a separate phase.

## Risks
- The canonical vault summary is now more complete but must be kept in sync when Phase 13 changes the project boundary.
- Because Phase 12.6c does not rerun the full smoke, it depends on the immediately previous Phase 12.6b evidence; acceptable because no runtime code changed in 12.6c.

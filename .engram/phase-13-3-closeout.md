# Phase 13.3 closeout — Skills BFF hardening

## Status
Implemented locally on branch `zoro/phase-13-3-skills-bff-hardening`.

## Summary
Phase 13.3 hardens the only write-capable MVP surface, `/skills`, by requiring a server-only trusted-origin allowlist for BFF write routes.

## Decisions
- `MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS` is the only trusted-origin configuration.
- The allowlist is server-only; no `NEXT_PUBLIC_*` variant is allowed.
- Missing allowlist fails closed with `403 trusted_origins_not_configured`.
- Missing `Origin` fails closed with `403 origin_required`.
- Invalid or non-allowlisted `Origin` fails closed with `403 origin_not_allowed`.
- Since current MVP does not use browser cookie/session auth and does not forward browser credentials upstream, strict Origin validation is the Phase 13.3 CSRF/perimeter control. Future cookie-backed auth must add a separate CSRF token/session design.

## Verification
Completed before PR:

- `npm run verify:perimeter-policy` — passed.
- `npm run verify:skills-server-only` — passed.
- `npm --prefix apps/web run typecheck` — passed.
- `npm --prefix apps/web run build` — passed.
- `git diff --check` — passed.
- directed secret scan over changed docs/scripts/code — passed.

## Follow-ups
- Phase 13.4: backend/API perimeter headers and error hardening.
- Phase 13.5: block smoke and closeout.
- #16 remains deferred until perimeter hardening block closes.

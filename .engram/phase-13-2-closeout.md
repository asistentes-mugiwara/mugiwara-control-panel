# Phase 13.2 closeout — perimeter runtime policy

Date: 2026-04-25

## What changed
- Added `docs/security-perimeter.md` as the supported perimeter contract.
- Updated `docs/runtime-config.md` to link the perimeter policy and declare `internet-public: unsupported`.
- Added `scripts/check-perimeter-policy.mjs` and `npm run verify:perimeter-policy`.
- Added `openspec/phase-13-2-perimeter-runtime-policy.md` and `openspec/phase-13-2-verify-checklist.md`.

## Decision
Phase 13.2 defines policy, not enforcement. The control panel remains local/private/Tailscale by default. Public internet exposure remains unsupported until explicit auth/session/CSRF/rate-limit design exists.

## Next
Phase 13.3 should enforce the write-route boundary for the Skills BFF using this policy: trusted origins, Origin/CSRF strategy and no browser credential/header forwarding.

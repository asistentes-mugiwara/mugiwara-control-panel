# Phase 13.2 verify checklist

## Scope checks
- [x] `docs/security-perimeter.md` added as perimeter contract.
- [x] `docs/runtime-config.md` links the perimeter contract.
- [x] `scripts/check-perimeter-policy.mjs` added as static guardrail.
- [x] `package.json` exposes `npm run verify:perimeter-policy`.
- [x] No runtime behavior changes intended.
- [x] No auth/Origin/CSRF enforcement implemented in this phase.

## Verify commands
- [x] `npm run verify:perimeter-policy`
- [x] `npm run verify:skills-server-only`
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] `git diff --check`
- [x] targeted sensitive-content scan for changed docs/scripts

## Review routing
- [x] Chopper required.
- [x] Franky required.
- [x] Usopp not required unless visible UI/copy changes are added.

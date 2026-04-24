# Phase 12.7 closeout — Next/PostCSS audit follow-up

Date: 2026-04-24
Issue: #17

## What changed
- Added root npm `overrides.postcss = 8.5.10` to patch advisory `GHSA-qx2v-qp2m-jg93` while staying on `next@15.5.15`.
- Added committed `package-lock.json` so npm audit has a reproducible dependency tree.
- Added `npm run audit:web`, implemented as `cd apps/web && npm audit`, because `npm --prefix apps/web audit` fails with `ENOLOCK` in this workspace layout.
- Added `openspec/phase-12-7-next-postcss-audit.md` with the dependency decision and verification evidence.

## Why
Issue #17 tracked an existing moderate `next -> postcss` audit finding. A Next major upgrade is not a safe patch path on this host because current `node` is `v18.19.1` and `next@16.2.4` declares `node >=20.9.0`.

## Verification
- `npm run audit:web` → found 0 vulnerabilities.
- `npm run typecheck:web` → passed.
- `npm run build:web` → passed.

## Learned
For this repo's npm workspace, app-local audit should be run from inside `apps/web` rather than through `npm --prefix`; the latter does not resolve the root lockfile for `npm audit` and fails with `ENOLOCK`.

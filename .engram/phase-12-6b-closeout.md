# Phase 12.6b closeout — Integration smoke and visual baseline

## Goal
Verify Phase 12 read-only backend/web integration and record the current visual baseline sweep before the final Phase 12 block closeout.

## Completed in this branch
- Added `openspec/phase-12-6b-integration-smoke-visual-baseline.md` to define the integration/visual-smoke boundary.
- Added `openspec/phase-12-6b-verify-checklist.md` with concrete evidence from static checks, backend regression, API smoke, web route smoke, browser console review and visual baseline review.
- Ran all current server-only guardrails for Memory, Mugiwaras, Skills, Vault, Dashboard and Healthcheck.
- Ran frontend typecheck and production build.
- Ran full Phase 12 backend regression: 27 tests passed.
- Started local FastAPI and Next.js dev/prod servers with `MUGIWARA_CONTROL_PANEL_API_URL` pointing to the local API.
- Smoked canonical API endpoints and web routes over HTTP 200.
- Used browser snapshots/console across `/dashboard`, `/mugiwaras`, `/skills`, `/memory`, `/vault` and `/healthcheck`.
- Confirmed `/skills` BFF transitions from loading to connected state under local API-backed runtime.
- Confirmed current browser viewport had no horizontal overflow in sampled page state.

## Security notes
- No new route, write surface, filesystem capability, dependency, auth flow or deployment exposure was added.
- Production route marker check found no backend API URL, server-only env name, traceback or stack-trace marker in rendered HTML.
- `/mugiwaras` intentionally displays a fixed canonical AGENTS.md excerpt with documented `/srv/crew-core/...` paths from the approved read-only surface. This is treated as existing product behavior, not a new leak introduced by 12.6b.
- Browser console across canonical routes showed no uncaught runtime errors.

## Visual notes
- The versioned `verify:visual-baseline` checklist covers canonical desktop/tablet/mobile targets: `1440×900`, `1024×768`, `390×844`.
- Live browser inspection in Hermes ran at `1280×720`; true viewport-resized screenshots were not available through the current browser tool.
- Vision review of `/healthcheck` found no obvious broken layout, horizontal overflow, broken content or sensitive message exposure in the current viewport.

## Verify snapshot
- `npm run verify:memory-server-only` → passed.
- `npm run verify:mugiwaras-server-only` → passed.
- `npm run verify:skills-server-only` → passed.
- `npm run verify:vault-server-only` → passed.
- `npm run verify:health-dashboard-server-only` → passed.
- `npm run verify:visual-baseline` → passed.
- `npm --prefix apps/web run typecheck` → passed.
- `npm --prefix apps/web run build` → passed twice; Phase 12 server pages remain dynamic where required.
- `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py apps/api/tests/test_vault_api.py apps/api/tests/test_healthcheck_dashboard_api.py` → 27 passed.
- `curl` API smoke → 7/7 endpoints returned HTTP 200.
- `curl` web route smoke → 6/6 canonical routes returned HTTP 200 in dev and production.
- Browser console route smoke → no JS errors observed.

## Deferred intentionally
- Final Phase 12 block closeout and vault Project Summary refresh: Phase 12.6c.
- Next/PostCSS advisory audit (#17): separate dependency/security maintenance track.
- Real Healthcheck host source connectors: future backend hardening phase.
- Playwright or automated visual regression: future testing infrastructure, not required for 12.6b.

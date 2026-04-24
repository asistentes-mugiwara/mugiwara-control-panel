# Phase 12.6b — Integration smoke and visual baseline

## Goal
Run the Phase 12 integration smoke across the read-only backend API and the current Next.js routes, then record a small visual baseline sweep for the MVP routes.

## Why now
Phase 12.6a closed focused follow-ups, docs and server-only guardrails. Before the final Phase 12 closeout, the project needs one verification-only slice that proves the API/web integration still works end to end and that the active routes remain visually usable across the canonical baseline.

## Scope
- Run full Phase 12 backend regression for read-only modules.
- Run server-only guardrails for Memory, Mugiwaras, Skills, Vault, Dashboard and Healthcheck.
- Run frontend typecheck and production build.
- Run `verify:visual-baseline` and perform a browser smoke over canonical routes.
- Confirm API-backed server pages render through `MUGIWARA_CONTROL_PANEL_API_URL` without console errors or sensitive leakage.
- Record evidence in the Phase 12.6b verify checklist and Engram closeout.

## Out of scope
- New product functionality.
- Dependency advisory remediation (#17), unless it blocks the smoke.
- Live host health sources for Healthcheck.
- Auth, deployment, write-surface changes or Playwright/visual regression infrastructure.
- Final Phase 12 block closeout and vault project-summary update; that remains Phase 12.6c.

## Routes under browser smoke
- `/dashboard`
- `/mugiwaras`
- `/skills`
- `/memory`
- `/vault`
- `/healthcheck`

## Definition of done
- Backend regression passes.
- All server-only guardrails pass.
- Frontend typecheck and build pass, with Phase 12 routes remaining dynamic where required.
- Local API and web dev servers render all canonical routes with API URL configured.
- Browser console is clean enough for closeout: no uncaught runtime errors and no backend URL, stack trace or response-body leakage in UI; documented fixed canonical paths already exposed by approved read-only pages are not treated as new leakage.
- Visual baseline checklist is executed and evidence is recorded.

## Verify expected
```bash
npm run verify:memory-server-only
npm run verify:mugiwaras-server-only
npm run verify:skills-server-only
npm run verify:vault-server-only
npm run verify:health-dashboard-server-only
npm run verify:visual-baseline
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py apps/api/tests/test_vault_api.py apps/api/tests/test_healthcheck_dashboard_api.py
git diff --check
```

## Review routing
- Franky: integration smoke evidence, runtime/dev-server operation and build/guardrail reliability.
- Chopper: no leakage regression across server-only fallbacks and API-backed rendering.
- Usopp: visual baseline sweep; request if the smoke reveals visual regressions or if the PR changes UI/docs materially enough for design review.

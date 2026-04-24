# Phase 12.6a closeout — Follow-ups, docs and guardrails

## Goal
Resolve the first focused Phase 12 closeout slice: make `/vault` fallback visible and align server-only runtime docs/guardrails for Vault, Dashboard and Healthcheck.

## Completed in this branch
- `/vault` now distinguishes real API data from fixture fallback in page state.
- `VaultClient` renders a visible `Estado de API` notice when using fallback.
- `vault-http.ts` uses typed `VaultApiError` codes for controlled failure states.
- `verify:vault-server-only` now checks that fallback observability remains present.
- `docs/runtime-config.md`, README, development docs, API module docs and read-model docs were aligned with current Phase 12 runtime contracts.
- `openspec/phase-12-6a-followups-docs-guardrails.md` and this checklist/closeout record the microphase boundary.

## Security notes
- The fallback notice only shows controlled status codes like `not_configured`, `http_<status>`, `invalid_payload` or `fetch_failed`.
- It does not expose backend URL, filesystem path, stack trace, response body or host detail.
- No new write surface, route, dependency or backend filesystem capability was added.

## Verify snapshot
- `npm run verify:vault-server-only` → passed.
- `npm run verify:health-dashboard-server-only` → passed.
- `npm --prefix apps/web run typecheck` → passed.
- `npm --prefix apps/web run build` → passed; `/vault`, `/dashboard` and `/healthcheck` remain dynamic (`ƒ`).
- `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py apps/api/tests/test_healthcheck_dashboard_api.py` → 12 passed.
- Full Phase 12 backend regression → 27 passed.
- `git diff --check` → passed.

## Expected reviewers
- Franky: operational observability, server-only runtime docs and guardrail coverage.
- Chopper: Vault fallback safety and no leak regression.

## Deferred intentionally
- Full integration smoke and visual baseline: Phase 12.6b.
- Final Phase 12 block closeout / vault summary update: Phase 12.6c.
- Next/PostCSS advisory audit: separate dependency/security maintenance track, not Phase 12.6a.
- Future live Healthcheck source hardening: deferred until real sources are connected.

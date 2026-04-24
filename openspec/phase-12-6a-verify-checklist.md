# Phase 12.6a verify checklist — Follow-ups, docs and guardrails

## Scope checks
- [x] `/vault` fallback is explicit and observable.
- [x] `/vault` fallback notice does not include backend URL, host paths, stack traces or response bodies.
- [x] `verify:vault-server-only` checks fallback observability markers.
- [x] `docs/runtime-config.md` documents Vault, Dashboard and Healthcheck server-only contracts.
- [x] README and development docs list current Phase 12 server-only guardrails.
- [x] `docs/api-modules.md` and `docs/read-models.md` align with Vault implementation.

## Verify evidence
- [x] `npm run verify:vault-server-only` → passed.
- [x] `npm run verify:health-dashboard-server-only` → passed.
- [x] `npm --prefix apps/web run typecheck` → passed.
- [x] `npm --prefix apps/web run build` → passed; `/vault`, `/dashboard` and `/healthcheck` remain dynamic (`ƒ`).
- [x] `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py apps/api/tests/test_healthcheck_dashboard_api.py` → 12 passed.
- [x] Full Phase 12 backend regression → 27 passed.
- [x] `git diff --check` → passed.

## Review gate
- [ ] Franky review requested.
- [ ] Chopper review requested.
- [ ] Review comments addressed or explicitly deferred.

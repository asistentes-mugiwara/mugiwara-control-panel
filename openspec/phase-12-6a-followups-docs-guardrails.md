# Phase 12.6a — Follow-ups, docs and guardrails

## Goal
Start Phase 12 closeout by resolving focused review follow-ups and aligning runtime documentation/guardrails before the full integration smoke.

## Why this is split out
Phase 12.6 would be too large as a single PR: it spans runtime follow-ups, docs, guardrails, API/web smoke, visual baseline and final block closeout. 12.6a deliberately handles only the small corrective/doc layer so 12.6b can focus on integration verification and 12.6c can close the block.

## Scope
- Make `/vault` fallback/degraded state observable when the backend API is missing, failing or returning an invalid payload.
- Keep `/vault` visually available through sane fixture fallback, but avoid silent success semantics.
- Extend `verify:vault-server-only` so fallback observability becomes a static guardrail.
- Document `/vault`, `/dashboard` and `/healthcheck` server-only runtime contracts in `docs/runtime-config.md`.
- Refresh README/development/API/read-model docs where Phase 12 reality had drifted.

## Out of scope
- Full Phase 12 integration smoke matrix.
- Visual baseline sweep across all routes.
- Dependency audit follow-up for Next/PostCSS advisory (#17).
- Connecting Healthcheck to live host sources.
- New auth, deployment or write-surface changes.

## Implementation notes
- `/vault/page.tsx` now classifies API load as `ready` or `fallback` and passes a controlled `apiErrorCode` to the client.
- `VaultClient` renders an explicit `Estado de API` notice in fallback mode.
- `vault-http.ts` throws typed `VaultApiError` codes: `not_configured`, `http_<status>` and `invalid_payload`.
- The notice deliberately does not show backend URL, host paths, stack traces or response bodies.

## Definition of done
- `/vault` fallback is visible, not silent.
- Runtime docs name the server-only contracts for Vault, Dashboard and Healthcheck.
- Guardrail check covers Vault fallback observability.
- Verify affected stack passes.
- PR review requested from Franky + Chopper.

## Verify expected
```bash
npm run verify:vault-server-only
npm run verify:health-dashboard-server-only
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
PYTHONPATH=. pytest apps/api/tests/test_vault_api.py apps/api/tests/test_healthcheck_dashboard_api.py
PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py apps/api/tests/test_vault_api.py apps/api/tests/test_healthcheck_dashboard_api.py
git diff --check
```

## Review routing
- Franky: runtime config documentation, server-only guardrails, fallback semantics and operational observability.
- Chopper: Vault fallback safety, no host/path/URL leakage, and continued deny-by-default boundary.
- Usopp: not required unless reviewers consider the fallback notice visually material enough for design review.

## Follow-up handling
- Issue #14 should be closable by this PR if reviewers accept the `/vault` degraded fallback notice.
- Issue #16 is partially addressed for runtime docs; future health-source hardening remains intentionally deferred.
- Issue #17 remains outside Phase 12.6a.

# Phase 13.5 closeout — Perimeter block smoke and canon

## Status
Merged via PR #27 (`b2a57a6a89f9ccb22e74a86742f1e589f8049db6`).

## Summary
Phase 13.5 closes the Phase 13 security/perimeter block without adding runtime behavior. It runs block-level verification across the backend API suite, perimeter/server-only guardrails, web typecheck/build, web audit, targeted backend smoke and directed secret/CORS scans. It also refreshes project canon so the next implementation block can move to issue #16 under the now-closed private perimeter model.

## Decisions
- Phase 13 is considered closed as a private-control-plane perimeter hardening block once the PR receives Chopper + Franky approval.
- Public internet exposure remains unsupported. No auth/session/login/rate-limit was added in Phase 13.
- `/skills` remains the only write-capable MVP surface and continues to require server-only trusted origins for write-capable BFF routes.
- FastAPI remains non-CORS/permissive by default and rejects browser preflight requests with sanitized `403 cors_not_supported`.
- Issue #16 can start next, but only as a separate Healthcheck/Dashboard hardening phase with explicit audited real sources and no generic host console behavior.

## Verification completed
- `PYTHONPATH=. python -m pytest apps/api/tests -q` — `30 passed`.
- `python -m py_compile` over FastAPI entry/module files — passed.
- `npm run verify:perimeter-policy` — passed.
- `npm run verify:skills-server-only` — passed.
- `npm run verify:memory-server-only` — passed.
- `npm run verify:mugiwaras-server-only` — passed.
- `npm run verify:vault-server-only` — passed.
- `npm run verify:health-dashboard-server-only` — passed.
- `npm --prefix apps/web run typecheck` — passed.
- `npm --prefix apps/web run build` — passed.
- `npm run audit:web` — `found 0 vulnerabilities`.
- Targeted backend API smoke for current MVP surfaces + CORS rejection + validation-error sanitization — passed.
- Directed secret/CORS scan — passed after excluding expected negative-pattern definitions in the guardrail script.
- `git diff --check` — passed after final docs/script changes.

## Follow-ups
- Phase 13.5 PR #27 merged with Chopper + Franky `mergeable_with_minor_followups`.
- Next implementation candidate: issue #16, scoped as Healthcheck/Dashboard real-source hardening after perimeter closure.
- Keep public internet support, cookie-backed auth/CSRF token design and rate limiting as separate future decisions.

# Phase 13.4 closeout — Backend/API perimeter hardening

## Status
Implemented locally on branch `zoro/phase-13-4-backend-api-perimeter-hardening`.

## Summary
Phase 13.4 hardens the FastAPI backend perimeter after the Skills BFF Origin boundary. The backend now applies private-control-plane security headers, explicitly rejects browser CORS preflight with a sanitized `403 cors_not_supported` response, and sanitizes FastAPI request-validation errors so invalid payloads are not echoed back.

## Decisions
- FastAPI remains non-CORS by default; no permissive CORS middleware was added.
- Browser preflight requests (`OPTIONS` + `Origin` + `Access-Control-Request-Method`) fail closed with `403 cors_not_supported` and no reflected `Access-Control-Allow-Origin`.
- API responses carry `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY` and `Cache-Control: no-store`.
- `RequestValidationError` now returns a stable sanitized `validation_error` envelope instead of Pydantic details that could include submitted bodies, hashes, host paths or field internals.
- This does not make public internet exposure supported; auth/session/rate-limit remain future scope.

## Verification
Completed before PR:

- `python -m pytest apps/api/tests/test_perimeter_api.py -q` — passed.
- `python -m pytest apps/api/tests -q` — passed.
- `npm run verify:perimeter-policy` — passed.
- `npm run verify:skills-server-only` — passed.
- `python -m py_compile apps/api/src/main.py` — passed.
- `npm --prefix apps/web run typecheck` — passed.
- `npm --prefix apps/web run build` — passed.
- `git diff --check` — passed.
- Directed scan for accidental secrets, permissive CORS snippets and public-exposure language — passed with only expected negative-test/guardrail references.

## Follow-ups
- Phase 13.5: block smoke and closeout.
- #16 remains deferred until the Phase 13 perimeter block is closed.

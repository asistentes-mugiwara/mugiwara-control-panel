# Phase 13.4 — Backend/API perimeter headers and error hardening

## Goal
Harden the FastAPI backend perimeter after the Skills BFF Origin boundary, keeping the control panel private-by-default and preventing backend/API errors from echoing sensitive request material.

## Scope
In scope:

- FastAPI security headers suitable for a private control-plane API;
- explicit rejection of browser CORS preflight instead of permissive CORS reflection;
- sanitized FastAPI request-validation errors;
- regression tests for backend rejection semantics;
- perimeter-policy guardrail coverage for the backend hardening invariants;
- documentation alignment in `docs/security-perimeter.md`.

Out of scope:

- user authentication, sessions or login UI;
- cookie-backed CSRF token design;
- rate limiting;
- public internet support;
- backend host allowlist enforcement;
- Healthcheck/Dashboard real-source connectors or host introspection (#16).

## Design

### Security headers
All backend responses receive these headers:

- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: no-referrer`;
- `X-Frame-Options: DENY`;
- `Cache-Control: no-store`.

The intent is not to make public exposure supported. It is a defense-in-depth baseline for the private control plane.

### CORS stance
FastAPI remains non-CORS by default. Phase 13.4 adds a deterministic rejection for browser preflight requests:

- request method `OPTIONS`;
- has `Origin`;
- has `Access-Control-Request-Method`.

Such requests return `403 cors_not_supported`, without `Access-Control-Allow-Origin` reflection and without echoing the submitted origin.

### Validation-error sanitization
`RequestValidationError` responses now return a stable sanitized envelope:

```json
{"detail":{"code":"validation_error","message":"Request validation failed."}}
```

This prevents Pydantic/FastAPI validation details from echoing submitted bodies, sensitive-looking content, hashes, host paths or field-level internals. Module-level domain errors continue to use their existing sanitized `detail.code`/`detail.message` envelopes.

## Files changed

- `apps/api/src/main.py`
  - adds private-control-plane security header middleware;
  - rejects CORS preflight with `403 cors_not_supported`;
  - adds sanitized `RequestValidationError` handler.
- `apps/api/tests/test_perimeter_api.py`
  - covers headers, CORS preflight rejection and validation-error sanitization.
- `scripts/check-perimeter-policy.mjs`
  - extends the static perimeter guardrail to assert backend hardening invariants.
- `docs/security-perimeter.md`
  - documents Phase 13.4 backend/API perimeter behavior.

## Verify
Required before PR:

```bash
python -m pytest apps/api/tests/test_perimeter_api.py -q
python -m pytest apps/api/tests -q
npm run verify:perimeter-policy
npm run verify:skills-server-only
python -m py_compile apps/api/src/main.py
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
git diff --check
```

Also run a directed scan over changed files for accidental secrets, raw host paths in error examples, permissive CORS snippets and public exposure language.

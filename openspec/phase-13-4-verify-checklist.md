# Phase 13.4 planning/verify checklist — Backend/API perimeter headers and error hardening

## Scope confirmation
- [x] Based on Phase 13.1 plan and Phase 13.3 closeout.
- [x] No auth/session/rate-limit implementation.
- [x] No Healthcheck/Dashboard real-source connectors.
- [x] No generic proxy, shell, Docker/systemd or arbitrary filesystem surface added.
- [x] No public internet support introduced.

## TDD evidence
- [x] Added failing tests first for backend security headers, CORS preflight rejection and request-validation sanitization.
- [x] Implemented only the perimeter behavior needed to satisfy those tests.

## Verify evidence
- [x] `python -m pytest apps/api/tests/test_perimeter_api.py -q`
- [x] `python -m pytest apps/api/tests -q`
- [x] `npm run verify:perimeter-policy`
- [x] `npm run verify:skills-server-only`
- [x] `python -m py_compile apps/api/src/main.py`
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] `git diff --check`
- [x] Directed secret/permissive-CORS/public-exposure scan over changed files.

## Review routing
- Chopper: CORS/perimeter semantics, sanitized error behavior and no sensitive echo.
- Franky: FastAPI middleware operability, headers, build/test impact and runtime compatibility.

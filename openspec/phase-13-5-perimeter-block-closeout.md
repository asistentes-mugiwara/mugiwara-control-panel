# Phase 13.5 — Perimeter block smoke and closeout

## Goal
Close Phase 13 as a security/perimeter hardening block by proving that the Phase 13.2–13.4 perimeter changes did not regress the Phase 12 read-only/backend-backed surfaces, and by aligning project canon before starting Healthcheck real-source work.

## Baseline being closed
Phase 13 delivered the perimeter block in small reviewable PRs:

1. **Phase 13.1 — Security perimeter plan**
   - Split the security/perimeter block and established Chopper + Franky review routing.
2. **Phase 13.2 — Perimeter contract and runtime policy**
   - Added `docs/security-perimeter.md` and `npm run verify:perimeter-policy`.
   - Declared local/private/Tailscale access supported and public internet exposure unsupported.
3. **Phase 13.3 — Skills BFF write-route hardening**
   - Enforced server-only `MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS` for write-capable `/skills` BFF routes.
   - Kept browser requests same-origin and avoided cookie/Authorization forwarding upstream.
4. **Phase 13.4 — Backend/API perimeter headers and error hardening**
   - Added FastAPI private-control-plane security headers.
   - Rejected browser CORS preflight with sanitized `403 cors_not_supported`.
   - Sanitized framework validation errors to avoid echoing payloads, paths or hashes.

## Scope
In scope:

- block-level verification over backend tests, perimeter/server-only guardrails, web typecheck/build and dependency audit;
- targeted backend API smoke across current MVP surfaces;
- directed scan for accidental secrets or permissive CORS/public-exposure snippets;
- closeout documentation in OpenSpec and `.engram/`;
- Project Summary refresh in the vault;
- explicit decision on whether issue #16 can start next.

Out of scope:

- new runtime behavior;
- new auth/session/login/rate-limit implementation;
- public internet support;
- Healthcheck/Dashboard real-source connectors;
- UI/UX changes;
- dependency changes.

## Block smoke performed
The block smoke covered:

- full backend API test suite;
- `py_compile` for FastAPI entry/module files affected by Phase 12–13 surfaces;
- all server-only/perimeter static guardrails;
- Next.js typecheck and production build;
- web audit;
- backend `TestClient` smoke for `/health`, `/api/v1/mugiwaras`, `/api/v1/memory`, `/api/v1/vault`, `/api/v1/healthcheck`, `/api/v1/dashboard` and `/api/v1/skills`;
- CORS preflight rejection smoke;
- validation-error sanitization smoke for a sensitive-looking payload;
- directed scan for secret-like tokens and permissive CORS implementation snippets.

## Result
Phase 13 is closed as a private-control-plane perimeter hardening block.

The stable perimeter state is:

- `internet-public: unsupported` remains explicit.
- Supported access remains local/private LAN/Tailscale/private reverse proxy only.
- `/skills` remains the only write-capable MVP surface.
- Browser writes to `/skills` require trusted server-only origins and do not forward browser cookies or `Authorization` upstream.
- FastAPI stays non-CORS/permissive by default and rejects browser preflight requests with a sanitized response.
- FastAPI responses carry private-control-plane security headers.
- Framework validation errors use a sanitized envelope.
- Phase 12 read-only/backend-backed surfaces still pass backend tests, server-only guardrails, typecheck/build and targeted API smoke.

## Decision on #16
Issue #16 can start after Phase 13, but only as a separately scoped Healthcheck/Dashboard hardening phase.

Constraints for #16:

- do not turn Healthcheck into a generic host console;
- add only explicit, audited real sources;
- keep outputs sanitized and avoid raw logs/stdout/stderr, shell output, Docker/systemd dumps or arbitrary filesystem reads;
- parse timestamps explicitly before aggregating freshness;
- only introduce `critical` severity aggregation when real sources can emit it deterministically;
- revisit backend host allowlist if the real deployment topology needs enforcement beyond the current server-only URL policy.

## Review routing
Request Chopper + Franky review.

- **Chopper:** verify the closeout preserves the private perimeter, no secret/public-exposure drift, and #16 constraints are safe.
- **Franky:** verify the block smoke is operationally sufficient and #16 can begin without reopening Phase 13.

Usopp is not required: no UI/UX or visual change is included.

## Definition of Done
- [x] Backend test suite passes.
- [x] Perimeter and server-only guardrails pass.
- [x] Web typecheck/build pass.
- [x] Web audit passes.
- [x] Targeted backend smoke passes.
- [x] Directed secret/CORS scan passes.
- [x] OpenSpec/checklist/Engram closeout created.
- [x] Vault Project Summary updated to mark Phase 13 closed and #16 next.
- [ ] PR reviewed by Chopper + Franky.

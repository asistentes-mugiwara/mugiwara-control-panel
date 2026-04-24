# Phase 13.1 — Security perimeter planning

## Goal
Decide the Phase 13 security/perimeter strategy before implementation and split the work into small, reviewable subphases.

## Current baseline
Phase 12 is closed as a read-only backend integration block. Current surfaces:

- `/dashboard`, `/healthcheck`, `/memory`, `/mugiwaras` and `/vault` read data through backend-owned read-only APIs or server-only adapters.
- `/skills` is the only MVP write-capable surface. Browser code calls same-origin BFF route handlers under `/api/control-panel/skills/**`; FastAPI remains source of truth for allowlist, path safety, stale hash, write policy and audit.
- `MUGIWARA_CONTROL_PANEL_API_URL` is server-only and must not move back to `NEXT_PUBLIC_*`.
- The intended access model is private control-plane usage, not public internet exposure.
- Open issue #16 remains future Healthcheck/Dashboard hardening for real sources and should not be mixed into this phase until perimeter guardrails are in place.

## Decision: split Phase 13
Phase 13 must be split. A single PR would mix architecture, frontend BFF hardening, backend policy, runtime docs, guardrails, smoke and reviewer loop. That repeats the Phase 12.5/12.6 overrun pattern.

Phase 13 should be a security/perimeter block with these subphases:

1. **Phase 13.1 — Security perimeter plan**
   - Scope: this document, verify checklist and Engram closeout only.
   - Outcome: approve the perimeter model and implementation order.

2. **Phase 13.2 — Perimeter contract and runtime policy**
   - Define the supported deployment/access model: local/private/Tailscale by default.
   - Document explicitly that internet-public exposure is unsupported until auth/session/rate-limit decisions exist.
   - Add or update docs for trusted origins, backend host validation policy and no-secret/no-log leakage expectations.
   - Add guardrails if the docs expose a concrete static invariant.

3. **Phase 13.3 — Skills BFF write-route hardening**
   - Add Origin validation for write-capable same-origin BFF routes where it is safe and deterministic.
   - Add CSRF readiness boundary: either explicit no-cookie/no-session statement with tests, or token/session design if product scope changes.
   - Keep browser fetches same-origin and do not forward arbitrary browser cookies or `Authorization` headers upstream.
   - Extend `verify:skills-server-only` or add a focused guardrail for Origin/CSRF/header-forwarding regressions.
   - Add targeted route-handler tests where practical.

4. **Phase 13.4 — Backend/API perimeter headers and error hardening**
   - Review FastAPI CORS/current exposure assumptions.
   - Ensure errors across backend/BFF remain sanitized for auth/perimeter failures.
   - Confirm no endpoint introduces host introspection, shell, Docker/systemd, raw logs or arbitrary filesystem reads.
   - Add regression tests for rejection semantics that belong in backend.

5. **Phase 13.5 — Block smoke and closeout**
   - Run full affected guardrails, backend tests, typecheck/build and targeted smoke.
   - Update runtime docs and vault Project Summary if the perimeter model materially changes.
   - Decide whether #16 can start after Phase 13 or needs another perimeter follow-up.

## Non-goals for Phase 13.1
- No runtime code changes.
- No auth implementation.
- No new public login page.
- No rate limiter implementation.
- No Healthcheck real-source connectors.
- No change to allowed skill write surface.
- No change to frontend UI beyond future operational copy if later subphases need it.

## Perimeter principles
- **Private by default:** the panel is a private control plane. Treat internet exposure as unsupported until explicitly designed.
- **Backend is still the security boundary:** frontend UX can clarify state, but policy enforcement belongs in FastAPI/BFF/server code.
- **No generic proxies:** BFF endpoints must stay exact and allowlisted.
- **No credential/header forwarding by default:** browser cookies and arbitrary `Authorization` headers must not be forwarded upstream unless a later auth design requires and constrains it.
- **No secret leakage:** errors, logs and docs must not expose backend URL, filesystem paths, `.env`, request bodies, diffs, hashes, tokens, cookies or raw host output.
- **Small reviewable increments:** each subphase should produce one focused PR with Chopper/Franky review when security/runtime boundaries are touched.

## Phase 13.2 Definition of Done
- `docs/runtime-config.md` or a new perimeter doc states supported/private access model and unsupported public exposure.
- Backend host/base URL policy is explicit: allowed schemes and future host allowlist decision point.
- No runtime behavior changes unless scoped and tested.
- Verify: `git diff --check`, relevant static guardrails, docs scan for secrets.
- Review: Chopper + Franky.

## Phase 13.3 Definition of Done
- Write-capable Skills BFF routes have deterministic Origin/CSRF boundary appropriate to current no-auth MVP.
- Tests or static guardrails reject regressions: generic proxy patterns, browser env leakage, forbidden header/cookie forwarding, missing server-only adapter, write routes without perimeter checks.
- Verify: `npm run verify:skills-server-only`, `npm --prefix apps/web run typecheck`, `npm --prefix apps/web run build`, targeted route tests if available.
- Review: Chopper + Franky; Usopp only if user-facing copy changes materially.

## Phase 13.4 Definition of Done
- FastAPI exposure/CORS/error behavior is documented and tested where policy exists.
- Backend endpoints keep sanitized envelopes and safe rejection semantics.
- No new host introspection or arbitrary filesystem/shell surface.
- Verify: backend tests for affected modules plus relevant web guardrails.
- Review: Chopper + Franky.

## Phase 13.5 Definition of Done
- Block-level verify proves perimeter hardening did not regress Phase 12 surfaces.
- Project docs/Engram/vault are aligned if the stable project state changed.
- Remaining follow-ups are explicit: #16 or new hardening issues.
- Review: Chopper + Franky; Usopp only if UI changed.

## Implementation order
Recommended order:

1. Close Phase 13.1 as a planning PR.
2. Implement Phase 13.2 docs/contract before code, so reviewers can agree on access model.
3. Implement Phase 13.3 Skills BFF hardening, because `/skills` is the only write-capable MVP surface.
4. Implement Phase 13.4 backend/API perimeter/error hardening.
5. Close with Phase 13.5 smoke/canon.

## Risks
- Adding partial auth too early can create a false sense of security. Do not invent login/session in a small hardening PR.
- Origin/CSRF checks can be brittle in local/private deployments if trusted origin config is unclear. Phase 13.2 should define this before Phase 13.3 enforces it.
- Mixing #16 Healthcheck real-source work into Phase 13 would expand host exposure before the perimeter is settled.
- Shared GitHub account review limitations mean reviewer approvals may be PR comments rather than formal GitHub approvals.

## Review routing for Phase 13.1
This is a security/perimeter design plan. Request:

- **Chopper:** security boundary, auth/CSRF/origin risk and whether the split is safe.
- **Franky:** runtime/private deployment assumptions, operational feasibility and verify strategy.

Usopp is not required for Phase 13.1 because there is no visible UI/UX change.

# Phase 12.3f — mugiwaras server-only config migration

## Scope
Migrate `/mugiwaras` from public frontend backend configuration to the server-only config pattern established by `/memory`.

## Why `/mugiwaras` first
`/mugiwaras` is the low-risk migration target from Phase 12.3e because:

- the route is already a server component;
- it already declares `export const dynamic = 'force-dynamic'`;
- it fetches the backend from the server page;
- it has no browser-side interactivity that requires direct backend fetch;
- its data is read-only and allowlisted.

## Changes
- `apps/web/src/modules/mugiwaras/api/mugiwaras-http.ts` imports `server-only`.
- The adapter reads `MUGIWARA_CONTROL_PANEL_API_URL` instead of `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL`.
- The adapter validates configured base URLs as `http:` or `https:`.
- `/mugiwaras` not-configured copy now instructs operators to use server runtime config.
- `scripts/check-mugiwaras-server-only.mjs` adds a static guardrail.
- `npm run verify:mugiwaras-server-only` exposes the guardrail.
- Runtime docs and README now list `/mugiwaras` alongside `/memory` as server-only.

## Out of scope
- No `/skills` migration.
- No Next BFF or route handlers for `/skills`.
- No backend API contract changes.
- No auth model change.
- No change to AGENTS markdown content or allowlist source.

## Definition of done
- `/mugiwaras` adapter no longer reads `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL`.
- `/mugiwaras` remains dynamic in `next build` output (`ƒ`).
- API-backed smoke works with `MUGIWARA_CONTROL_PANEL_API_URL=http://127.0.0.1:8011`.
- AGENTS content is still only rendered when received from backend allowlisted endpoint.
- Browser console is clean in smoke.
- Chopper + Franky review and accept the migration.

## Verify checklist
- [x] `npm run verify:mugiwaras-server-only`
- [x] `npm run verify:memory-server-only`
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] Backend regression: `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py`
- [x] Browser/API smoke for `/mugiwaras` with server-only env.
- [x] Invalid config smoke: `MUGIWARA_CONTROL_PANEL_API_URL=file:///tmp` keeps `/mugiwaras` at HTTP 200 with fixture fallback and without AGENTS content.
- [x] `git diff --check`

## Reviewer routing
- **Chopper:** required; config/security boundary and AGENTS read-only exposure.
- **Franky:** required; runtime config, dynamic rendering, smoke and guardrail.
- **Usopp:** not required; no UI layout/UX change beyond operational copy.

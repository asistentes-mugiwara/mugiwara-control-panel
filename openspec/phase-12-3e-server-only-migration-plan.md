# Phase 12.3e — server-only migration plan for skills/mugiwaras

## Scope
Plan, but do not implement, the migration of `/mugiwaras` and `/skills` away from `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` toward server-only backend configuration.

This phase exists because Phase 12.3c/12.3d established the safe server-only pattern for `/memory`, and Chopper accepted `/skills` + `/mugiwaras` as a deliberate temporary exception only if handled in a separate reviewed phase.

## Current state

### `/mugiwaras`
- `apps/web/src/app/mugiwaras/page.tsx` is already a server component.
- It declares `export const dynamic = 'force-dynamic'`.
- Its adapter `apps/web/src/modules/mugiwaras/api/mugiwaras-http.ts` reads `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL`.
- It fetches `GET /api/v1/mugiwaras` from the server page and renders allowlisted crew cards plus canonical AGENTS content when backend is available.
- No browser-side interactivity depends on direct backend fetch.

### `/skills`
- `apps/web/src/app/skills/page.tsx` is a client component.
- `apps/web/src/modules/skills/api/skills-http.ts` is imported by browser code and reads `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL`.
- The surface performs multiple browser-side calls:
  - `GET /api/v1/skills`
  - `GET /api/v1/skills/audit`
  - `GET /api/v1/skills/{skill_id}`
  - `POST /api/v1/skills/{skill_id}/preview`
  - `PUT /api/v1/skills/{skill_id}`
- Unlike `/mugiwaras` and `/memory`, `/skills` includes controlled write/preview flows and therefore cannot be migrated by only adding a server loader.

## Decision
Migrate in two separate implementation PRs, not one combined change.

1. **Phase 12.3f — `/mugiwaras` server-only config migration**
   - Low complexity.
   - No client fetch required.
   - Convert adapter to `server-only`.
   - Read `MUGIWARA_CONTROL_PANEL_API_URL`.
   - Validate URL as `http:`/`https:`.
   - Keep `force-dynamic`.
   - Update not-configured copy away from `NEXT_PUBLIC_*`.
   - Add/extend guardrail check for mugiwaras.

2. **Phase 12.3g — `/skills` server-side proxy/BFF design**
   - Higher complexity and higher risk because `/skills` has preview/update calls.
   - Do not expose backend base URL to browser.
   - Introduce a Next-side server boundary before changing the UI:
     - option A: Next route handlers under `/api/control-panel/skills/**` that proxy to FastAPI using server-only config;
     - option B: split initial read into server loader, then keep writes behind explicit server actions/route handlers.
   - Preserve existing policy checks in FastAPI; Next route handlers must not become an authorization bypass.
   - Keep request payloads minimal and never log skill contents, diffs, tokens or backend URLs.

## Proposed migration order

### Step 1 — `/mugiwaras`
Reviewer gate: **Chopper + Franky**.

Tasks:
- Add `import 'server-only'` to `mugiwaras-http.ts`.
- Replace `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` with `MUGIWARA_CONTROL_PANEL_API_URL`.
- Validate URL protocol as `http:` or `https:`.
- Update not-configured copy in `/mugiwaras/page.tsx`.
- Add `npm run verify:mugiwaras-server-only` or extend a generic server-only config check.
- Verify build shows `/mugiwaras` remains dynamic (`ƒ`).
- Smoke with:
  ```bash
  MUGIWARA_CONTROL_PANEL_API_URL=http://127.0.0.1:8011 npm --prefix apps/web run dev -- --hostname 127.0.0.1 --port 3017
  ```

Acceptance:
- `/mugiwaras` renders API-backed content with server-only env.
- No `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` remains in mugiwaras adapter or operational copy.
- Browser bundle does not need the backend base URL for this surface.
- AGENTS content remains available only via backend allowlisted endpoint and private control-plane boundary.

### Step 2 — `/skills` design spike
Reviewer gate: **Chopper + Franky** before implementation.

Tasks:
- Decide between Next route handlers and server actions for the skills BFF.
- List exact proxy endpoints needed for catalog, audit, detail, preview and update.
- Define payload allowlists and error sanitization.
- Define how expected SHA and actor continue to flow without widening write permissions.
- Decide whether initial catalog/detail data should be server-loaded to reduce client waterfalls.
- Define a dedicated guardrail check so `skills-http.ts` no longer reads `NEXT_PUBLIC_*` after migration.

Acceptance:
- No backend URL in browser bundle.
- Existing FastAPI authorization and safe-write policy remain the source of truth.
- No skill content, previews, diffs, backend URL, tokens or internal paths are logged by the Next proxy layer.
- Browser-visible API errors are semantic and sanitized.

### Step 3 — `/skills` implementation
Only after Step 2 is reviewed.

Tasks:
- Implement selected BFF pattern.
- Move backend-base-url reads to server-only code.
- Keep client component for interactive UX, but point browser fetches at same-origin Next endpoints if route handlers are selected.
- Add tests/checks and smoke preview/update flows against local API.

## Non-goals
- No auth model change in this plan.
- No replacement of FastAPI as the policy enforcement layer.
- No new write capabilities.
- No live memory-store connector.
- No exposure of `.env`, backend URL values, skill file paths beyond current allowlisted contracts, tokens or raw logs.

## Risks
- `/mugiwaras` risk: low. Main risk is accidentally freezing fallback at build or losing AGENTS read-only availability.
- `/skills` risk: medium. It contains write paths and content preview/update payloads; a proxy layer must not log or widen write policy.
- Operational risk: medium if two env vars coexist too long. The docs must keep stating which vertical uses which variable until migration completes.

## Verification checklist for future implementation PRs
- `npm run verify:memory-server-only`
- New mugiwaras/skills server-only guardrail checks as applicable.
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- Backend regression:
  ```bash
  PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py
  ```
- Browser smoke for affected surface.
- Search for forbidden public-env use in migrated adapters/copy.

## Reviewer routing
- **Chopper:** required for both future implementation PRs because this is config/security boundary and `/skills` includes write flows.
- **Franky:** required for both future implementation PRs because this affects runtime config, dynamic rendering, local smoke, and future CI guardrails.
- **Usopp:** not required unless the implementation changes visible UI/UX beyond operational copy.

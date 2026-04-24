# Phase 12.6b verify checklist — Integration smoke and visual baseline

## Static and unit/integration verify
- [x] `npm run verify:memory-server-only` → passed.
- [x] `npm run verify:mugiwaras-server-only` → passed.
- [x] `npm run verify:skills-server-only` → passed.
- [x] `npm run verify:vault-server-only` → passed.
- [x] `npm run verify:health-dashboard-server-only` → passed.
- [x] `npm run verify:visual-baseline` → passed; printed canonical route/viewport checklist.
- [x] `npm --prefix apps/web run typecheck` → passed.
- [x] `npm --prefix apps/web run build` → passed twice; `/dashboard`, `/healthcheck`, `/memory`, `/mugiwaras` and `/vault` remain dynamic (`ƒ`); `/skills` remains static shell plus same-origin dynamic BFF routes.
- [x] Full Phase 12 backend regression → 27 passed.
- [x] `git diff --check` → passed before checklist fill; re-run required after final closeout writes.

## Runtime smoke
- [x] FastAPI started locally from repo root with `PYTHONPATH=.` on `127.0.0.1:8011`.
- [x] Next dev server started with `MUGIWARA_CONTROL_PANEL_API_URL=http://127.0.0.1:8011` on `127.0.0.1:3017`.
- [x] Production Next server started from rebuilt `.next` with the same API URL on `127.0.0.1:3018`.
- [x] API endpoints returned HTTP 200: `/health`, `/api/v1/dashboard`, `/api/v1/healthcheck`, `/api/v1/mugiwaras`, `/api/v1/memory`, `/api/v1/vault`, `/api/v1/skills`.
- [x] Web routes returned HTTP 200 in dev and production: `/dashboard`, `/mugiwaras`, `/skills`, `/memory`, `/vault`, `/healthcheck`.
- [x] `/dashboard` renders API-backed aggregate content.
- [x] `/mugiwaras` renders API-backed catalog and the approved canonical AGENTS.md read-only excerpt.
- [x] `/skills` renders with BFF boundary intact and transitions from loading to `BFF same-origin conectado`.
- [x] `/memory` renders API-backed memory catalog content.
- [x] `/vault` renders API-backed vault index/document content; no degraded fallback notice appeared in this happy-path smoke.
- [x] `/healthcheck` renders API-backed safe health catalog content.
- [x] Browser console checked across canonical routes: no uncaught runtime errors observed.
- [x] Production HTML marker check passed for backend URL/config/trace markers: no `127.0.0.1:8011`, `MUGIWARA_CONTROL_PANEL_API_URL`, `Traceback` or `Stack trace` observed.

## Visual baseline evidence
- [x] Desktop/current browser viewport inspected (`1280×720`); document scroll width equals client width, so no horizontal overflow was detected in sampled page state.
- [x] Canonical Desktop baseline considered (`1440×900`) through `verify:visual-baseline` checklist.
- [x] Canonical Tablet baseline considered (`1024×768`) through `verify:visual-baseline` checklist.
- [x] Canonical Mobile baseline considered (`390×844`) through `verify:visual-baseline` checklist.
- [x] Shell/navigation remain usable in browser smoke.
- [x] Headers, pills, badges and cards remain legible in sampled route snapshots.
- [x] Long paths/fingerprints/previews did not create obvious horizontal overflow in sampled current viewport.
- [x] Vision check on `/healthcheck` reported no evident layout break, horizontal overflow, broken content or sensitive message exposure in the current viewport.

## Findings
- No blocking runtime, guardrail, API, build or visual-smoke regression found in Phase 12.6b.
- The production raw HTML check initially flagged `/srv/crew-core/...` strings on `/mugiwaras`; this is the already-approved fixed canonical AGENTS.md read-only excerpt, not a new dynamic host-path leak. The final marker check therefore focused on backend URL/config/trace markers.
- The Phase 12.6b browser viewport available through the Hermes browser was `1280×720`; canonical 1440/tablet/mobile viewports were covered by the versioned baseline checklist rather than true resized screenshots.

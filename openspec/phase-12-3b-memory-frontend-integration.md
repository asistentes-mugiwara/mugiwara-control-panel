# Phase 12.3b — memory frontend API integration

## Scope
Integrate `/memory` with the Phase 12.3a read-only Memory API while preserving the existing safe fixture fallback and the explicit built-in/Honcho separation.

## Design
- Keep `/memory` interactive, but move API reads to the server page to avoid browser-side CORS and prevent direct client fetching of memory endpoints.
- Split the route into:
  - `page.tsx` server loader: fetches `GET /api/v1/memory` and safe details for all known Mugiwara slugs when API URL is configured.
  - `MemoryClient.tsx` client component: owns only UI state (`selectedMugiwara`, `selectedSource`) and receives sanitized initial data.
- Preserve fixture fallback when `MUGIWARA_CONTROL_PANEL_API_URL` is absent, invalid, unavailable or partially degraded. This server-only env replaced the earlier `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` Memory smoke variable in Phase 12.3c.
- Keep payloads limited to existing contracts: summaries, counts, badges, freshness, links and allowlisted facts.

## Tasks
- [x] Add frontend Memory API adapter.
- [x] Split `/memory` into server loader + client component.
- [x] Render `API solo lectura` vs `Fallback saneado` state in the header.
- [x] Tighten Memory tab semantics and prevent short status badges from wrapping.
- [x] Preserve source tabs and safe fallback content.
- [x] Smoke `/memory` with API configured and verify no browser console CORS/fetch errors.

## Out of scope
- No live memory store connector.
- No backend contract expansion.
- No raw prompts, observations, sessions or Engram detail.
- No write actions.

## Definition of done
- With API configured, `/memory` renders API-backed summary/detail content.
- The source tabs expose a real `tablist`; informational badges are not announced as tabs.
- Without API configured or on API error, `/memory` keeps the safe fallback and explicit notice.
- Browser console stays clean in the API-backed smoke.
- Typecheck/build/backend regression pass.

## Reviewer routing
- Chopper: review data boundary and that server-side fetch still exposes only sanitized payloads.
- Usopp: review visible `/memory` UI state, copy and source separation.

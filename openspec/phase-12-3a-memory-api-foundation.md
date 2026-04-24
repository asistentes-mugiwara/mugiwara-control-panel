# Phase 12.3a — memory read-only API foundation

## Scope
Create the backend-owned, sanitized read-only Memory API before wiring `/memory` to live backend data.

## Why split 12.3
The `memory` vertical has higher leak risk than `mugiwaras`: raw memory stores, prompts, internal IDs and relational context must not escape. This microphase introduces only a small backend-owned safe catalog and tests the leak boundary before frontend integration.

## Design
- Add backend module `apps/api/src/modules/memory`.
- Expose:
  - `GET /api/v1/memory` → sanitized agent summaries.
  - `GET /api/v1/memory/{slug}` → sanitized detail for one Mugiwara.
- Return only allowlisted fields already present in shared contracts:
  - `mugiwara_slug`, `summary`, `fact_count`, `last_updated`, `badges`.
  - `built_in_summary`, `honcho_facts`, `freshness`, `links`.
- Keep built-in and Honcho visible as distinct sources in meta and detail text.
- Do not expose Engram in this surface yet.
- Do not read live memory stores, DB files, prompts, sessions or observations in this microphase.

## Tasks
- [x] Add RED backend tests for memory summary/detail/unknown slug and empty source state.
- [x] Add `memory` domain/service/router.
- [x] Register memory router in FastAPI app.
- [x] Update backend docs for the module.
- [x] Record verify evidence and continuity artifacts.

## Out of scope
- Frontend `/memory` adapter/integration.
- Live Honcho/builtin memory connector.
- Engram project memory surface.
- Any write endpoint.

## Definition of done
- `/api/v1/memory` returns a read-only `memory.summary` envelope with `sources`, `sanitized`, and `read_only` meta.
- `/api/v1/memory/{slug}` returns a read-only `memory.agent_detail` envelope without raw memory dumps.
- Unknown slug returns semantic 404 without host paths.
- Empty source can represent `not_configured` state.
- Backend tests and py_compile pass.

## Reviewer routing
- Chopper: required, because this phase defines the leak boundary for memory data.
- Franky: not required unless runtime/deploy changes appear.
- Usopp: not required until frontend `/memory` integration changes.

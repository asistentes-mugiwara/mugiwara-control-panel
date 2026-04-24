# Phase 12.1 — read-only contracts foundation

## Scope
Establish the shared contract foundation for the Phase 12 read-only backend integration block without introducing module endpoints or host/filesystem access.

## SDD summary
### Explore
- Existing shared TypeScript contracts live in `packages/contracts/src`, currently only `resource.ts` and `skills.ts`.
- Backend responses already use `apps/api/src/shared/contracts.py::resource_response` but the helper did not expose or validate the allowed status set.
- `docs/read-models.md` already defines conceptual read models for `dashboard.summary`, `healthcheck.summary[]`, `memory.agent_summary`, `memory.agent_detail`, `vault.index`, `vault.document`, `mugiwara.card` and `mugiwara.profile`.

### Decision
- Keep Phase 12.1 contract-only: no new module routers and no filesystem/host adapters.
- Add a single TypeScript contract module, `packages/contracts/src/read-models.ts`, for the non-`skills` read-only MVP surfaces.
- Export `RESOURCE_STATUSES` from `resource.ts` so runtime/client code can share the same allowed status vocabulary as the type.
- Add backend validation to `resource_response` so unknown backend statuses fail early instead of silently creating invalid envelopes.

### Tasks
- [x] Add tests for backend envelope status conventions.
- [x] Add allowed status validation to backend shared contracts.
- [x] Add read-only TypeScript contracts for dashboard/system, mugiwaras, memory, vault and healthcheck.
- [x] Keep implementation endpoint-free and filesystem-free.
- [x] Record verify evidence and closeout artifacts.

## Definition of done
- Contract types exist for all Phase 12 read-only MVP surface families.
- Backend helper validates the same resource status vocabulary used by TypeScript contracts.
- No real endpoints, filesystem reads, vault reads or host checks are introduced.
- `docs/read-models.md` remains compatible with the implemented contract names and fields.

## Files changed
- `packages/contracts/src/resource.ts` — exported `RESOURCE_STATUSES` and derived `ResourceStatus` from the constant.
- `packages/contracts/src/read-models.ts` — added read-only MVP contracts and response envelope aliases.
- `apps/api/src/shared/contracts.py` — added allowed status set and validation in `resource_response`.
- `apps/api/tests/test_shared_contracts.py` — added tests for accepted/rejected envelope statuses.

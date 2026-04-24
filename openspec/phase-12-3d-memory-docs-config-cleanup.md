# Phase 12.3d — memory config documentation cleanup

## Scope
Close the documentation follow-up from Phase 12.3c by aligning Memory docs and OpenSpec artifacts with the server-only runtime config contract.

## Changes
- Add `docs/runtime-config.md` as the canonical runtime configuration note.
- Update root `README.md` to expose `verify:memory-server-only` and point to runtime config docs.
- Correct Phase 12.3b artifacts that still described Memory smoke/fallback using `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL`.
- Add Phase 12.3c closeout artifact documenting the server-only decision and verify evidence.

## Out of scope
- No code runtime changes.
- No backend/API contract changes.
- No migration of `/skills` or `/mugiwaras` from `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL`.
- No live memory-store connector.

## Definition of done
- Memory documentation names `MUGIWARA_CONTROL_PANEL_API_URL` as the runtime variable for `/memory`.
- Docs explicitly state that `/skills` and `/mugiwaras` still use the historical `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` pending a separate migration.
- `npm run verify:memory-server-only`, frontend typecheck/build and backend regression still pass.
- Search confirms no Memory-specific OpenSpec artifact instructs operators to configure Memory via `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL`.

## Reviewer routing
- Chopper: required, because this is security/config documentation for a leak-boundary follow-up.
- Franky: optional unless he wants to review operational clarity; no runtime change.
- Usopp: not required; no UI/copy surface change.

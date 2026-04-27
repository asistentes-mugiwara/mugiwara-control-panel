# Phase 17.4c closeout — Usage Hermes activity backend

## Scope
17.4c adds only the backend read model for Hermes local activity aggregation. It does not add UI and does not close #51.

## Decision
17.4c was not split further because the safe scope is one backend-only boundary: read-only profile-state aggregation behind server-side configuration, with no writer, no runtime producer and no visible UI.

## Implemented
- `GET /api/v1/usage/hermes-activity?range=7d|30d|current_cycle|previous_cycle`.
- `UsageService` optional `MUGIWARA_HERMES_PROFILES_ROOT` server-side config.
- Explicit Mugiwara profile allowlist.
- Read-only SQLite access to profile state databases using `mode=ro`.
- Aggregated output only: sessions, messages, tool calls, first/last activity, activity level and dominant profile.
- 422 saneado para rangos inválidos.
- Shared TS contracts for `UsageHermesActivity`.
- `verify:usage-server-only` extended with backend guardrails for Hermes activity.
- Docs updated: `docs/api-modules.md`, `docs/read-models.md`, `docs/runtime-config.md`.

## Privacy boundary
The endpoint does not select or serialize raw prompts, conversations, tool payloads, user IDs, chat IDs, delivery targets, tokens by session/conversation, costs, billing URLs, headers, cookies, secrets, logs, model config, titles or profile DB paths.

## Verify
- Red initial: usage tests failed before implementation because `UsageService` did not accept `hermes_profiles_root` and no endpoint existed.
- `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py`.
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` → 12 passed.
- `npm run verify:usage-server-only` → passed after backend guardrail update.
- `npm --prefix apps/web run typecheck` → passed.
- `npm --prefix apps/web run build` → passed; `/usage` remains dynamic (`ƒ`).
- `git diff --check` → passed.
- TestClient smoke with `MUGIWARA_HERMES_PROFILES_ROOT` configured locally returned `ready` aggregates without profile DB path or sensitive markers.

## Deferred
- 17.4d UI activity panel in `/usage`.
- Final #51 closeout/canon after UI exists and reviews pass.

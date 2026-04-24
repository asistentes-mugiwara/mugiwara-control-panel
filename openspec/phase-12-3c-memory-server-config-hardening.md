# Phase 12.3c — memory server-only config hardening

## Scope
Harden `/memory` runtime configuration before any live memory-store connector is introduced.

## Decision
Memory must use a server-only backend URL:

- Use `MUGIWARA_CONTROL_PANEL_API_URL` for `/memory`.
- Do not use `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` in the Memory adapter or Memory operational notice.
- Keep `/skills` and `/mugiwaras` on their previous config path until a separate migration phase decides otherwise.

## Implementation
- `apps/web/src/modules/memory/api/memory-http.ts` imports `server-only`.
- The Memory adapter validates configured URLs as `http:` or `https:`.
- Invalid or missing config falls back to sanitized local fixtures and does not display the configured URL.
- `apps/web/src/app/memory/page.tsx` declares `export const dynamic = 'force-dynamic'` so runtime server config is not frozen at build time.
- `npm run verify:memory-server-only` checks the server-only boundary textually until formal CI exists.

## Verify evidence
- `npm run verify:memory-server-only` → OK.
- `npm --prefix apps/web run typecheck` → OK.
- `npm --prefix apps/web run build` → OK; `/memory` is dynamic (`ƒ`).
- `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py` → 15 passed.
- Browser smoke with `MUGIWARA_CONTROL_PANEL_API_URL=http://127.0.0.1:8011` → `/memory` renders API-backed content and browser console stays clean.

## Review
- Chopper: `mergeable_with_minor_followups`.
- Franky: `mergeable_with_minor_followups`.

## Follow-ups accepted
- Document the new Memory config contract.
- Add `verify:memory-server-only` to CI when formal CI exists.
- Decide later whether `/skills` and `/mugiwaras` should migrate to server-only config.

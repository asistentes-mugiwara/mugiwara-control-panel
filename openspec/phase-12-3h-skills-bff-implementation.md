# Phase 12.3h — Skills BFF/server-only implementation

## Scope
Implement the `/skills` BFF/server-only migration designed in Phase 12.3g.

## Implemented changes
- Added Next.js route handlers under `/api/control-panel/skills/**`:
  - `GET /api/control-panel/skills`
  - `GET /api/control-panel/skills/audit`
  - `GET /api/control-panel/skills/[skillId]`
  - `POST /api/control-panel/skills/[skillId]/preview`
  - `PUT /api/control-panel/skills/[skillId]`
- Added `apps/web/src/modules/skills/api/skills-server-http.ts` as server-only upstream adapter.
- Added `apps/web/src/modules/skills/api/skills-bff-validation.ts` for BFF guardrail validation.
- Refactored browser adapter `apps/web/src/modules/skills/api/skills-http.ts` to call same-origin `/api/control-panel/skills` endpoints only.
- Updated `/skills/page.tsx` operational copy to avoid backend base URL display and public env instructions.
- Added `scripts/check-skills-server-only.mjs` and `npm run verify:skills-server-only`.
- Updated `README.md` and `docs/runtime-config.md`.

## Security boundary
The BFF is an allowlisted route boundary, not a generic proxy.

It does not accept arbitrary upstream path, URL, target, method or query-controlled routing. Dynamic routes validate `skillId` against:

```text
^[a-z0-9][a-z0-9_-]{0,79}$
```

Preview/update routes validate:
- `Content-Type: application/json`;
- request body <= 256 KiB;
- `content` is non-empty text, max 200,000 UTF-8 bytes, no NUL;
- `expected_sha256` is 64 hex chars;
- `actor` is non-empty, trimmed and <= 120 chars for update.

## Runtime config
`/skills` now uses:

```bash
MUGIWARA_CONTROL_PANEL_API_URL=http://127.0.0.1:8011
```

The browser no longer needs `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` for `/skills`.

The server adapter validates `http:`/`https:` URL schemes. Missing or invalid config returns sanitized `not_configured` errors through the BFF instead of exposing the value.

## Cache/logging/credential policy
- BFF upstream fetches use `cache: 'no-store'`.
- Route handlers force dynamic/no-store execution.
- No request-body logging is introduced.
- The BFF does not forward browser cookies or arbitrary Authorization headers to FastAPI.
- Browser-visible errors use a narrow `detail.code` / `detail.message` shape.

## FastAPI remains source of truth
The Next BFF is a boundary of exposure and validation, not the final authorization layer.

FastAPI still owns:
- skill allowlist;
- editable vs read-only policy;
- path safety and symlink rejection;
- stale hash checks;
- write execution;
- audit append.

## Guardrail
Run:

```bash
npm run verify:skills-server-only
```

The check fails if:
- the browser adapter reads `process.env` or `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL`;
- the browser adapter contains absolute backend URLs;
- the server adapter lacks `server-only` or `MUGIWARA_CONTROL_PANEL_API_URL`;
- route handlers lose dynamic/no-store flags;
- key validation functions disappear;
- obvious generic proxy snippets appear.

## Verify expected before merge
```bash
npm run verify:skills-server-only
npm run verify:memory-server-only
npm run verify:mugiwaras-server-only
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py
```

Manual smoke expected:
- BFF returns sanitized `not_configured` when server env is missing or invalid.
- With local FastAPI configured, `/skills` loads catalog/detail/audit through BFF.
- Preview works through BFF for a safe, non-persisting diff.
- Update route is not smoke-tested against production skills unless a safe fixture/restore workflow is in place.

## Reviewer routing
- Chopper: required because this touches endpoint/input boundary and the only write-capable MVP surface.
- Franky: required because this touches Next route handlers, runtime config, no-store behaviour and guardrails.
- Usopp: not required unless reviewers consider the visible copy changes material. The UI structure remains unchanged; only operational copy changes to remove backend URL exposure.

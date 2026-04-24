# Phase 12.3g — Skills BFF / server-side design

## Scope
Design the `/skills` migration away from `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` toward a Next.js server-side boundary.

This phase is deliberately **design-only**. It must not change runtime behaviour yet.

## Why this phase exists
Phase 12.3c moved `/memory` to server-only backend configuration. Phase 12.3f did the same for `/mugiwaras`.

`/skills` cannot be migrated by the same simple server-loader pattern because it is currently a client component with browser-side catalog, audit, detail, preview and update calls. It is also the only MVP surface with controlled write capability, so the server-side boundary must be designed before implementation.

## Current state

### Frontend
- Page: `apps/web/src/app/skills/page.tsx`.
- It is a client component (`'use client'`).
- It imports `apps/web/src/modules/skills/api/skills-http.ts` directly into browser code.
- The client adapter reads `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL`.
- Browser-visible operational copy currently mentions the public env var.
- The page performs these calls from the browser:
  - `GET /api/v1/skills`
  - `GET /api/v1/skills/audit`
  - `GET /api/v1/skills/{skill_id}`
  - `POST /api/v1/skills/{skill_id}/preview`
  - `PUT /api/v1/skills/{skill_id}`

### Backend
- FastAPI router: `apps/api/src/modules/skills/router.py`.
- Source of truth: `apps/api/src/modules/skills/service.py`.
- The backend already enforces the important policy:
  - `skill_id`, never client-supplied path.
  - allowlisted registry only.
  - editable skills limited to `SKILL.md` under `/srv/crew-core/skills-source`.
  - symlinks rejected.
  - payload size limit: `MAX_SKILL_BYTES = 200_000`.
  - expected `sha256` stale-check before preview/update.
  - audit append for update attempts.

## Decision
Use **Next.js route handlers** as a same-origin BFF for `/skills` in Phase 12.3h.

Do not use server actions for this migration yet.

## Rationale
Route handlers are the safer next step because:

1. The existing `/skills` page can remain a client component with minimal UI churn.
2. The browser can call same-origin Next endpoints instead of the FastAPI base URL.
3. The BFF can use `MUGIWARA_CONTROL_PANEL_API_URL` server-only and `import 'server-only'` in backend adapter code.
4. The endpoint surface can be explicitly allowlisted and tested.
5. The implementation can preserve FastAPI as the policy source of truth instead of duplicating write rules in the frontend.
6. Rollback is straightforward: revert the BFF adapter and client endpoint mapping without changing backend skill policy.

Server actions may be revisited later if the page is split into server/client islands, but that is out of scope for this hardening pass.

## Proposed Next route handlers
Create route handlers under `apps/web/src/app/api/control-panel/skills/`:

| Browser endpoint | Method | Upstream FastAPI endpoint | Purpose |
| --- | --- | --- | --- |
| `/api/control-panel/skills` | `GET` | `/api/v1/skills` | catalog |
| `/api/control-panel/skills/audit` | `GET` | `/api/v1/skills/audit` | recent audit |
| `/api/control-panel/skills/[skillId]` | `GET` | `/api/v1/skills/{skill_id}` | detail |
| `/api/control-panel/skills/[skillId]/preview` | `POST` | `/api/v1/skills/{skill_id}/preview` | preview diff |
| `/api/control-panel/skills/[skillId]` | `PUT` | `/api/v1/skills/{skill_id}` | controlled update |

The BFF is not a generic proxy. No route should accept arbitrary upstream path, arbitrary method, arbitrary query string or arbitrary target URL.

## Server-only adapter shape
Add a server-only adapter, for example:

- `apps/web/src/modules/skills/api/skills-server-http.ts`

Required properties:

- starts with `import 'server-only'`;
- reads only `MUGIWARA_CONTROL_PANEL_API_URL`;
- trims one trailing slash;
- validates the URL using `new URL(...)`;
- accepts only `http:` or `https:`;
- throws an internal typed error such as `SkillsServerApiError` with semantic `code`, sanitized `message`, and HTTP `status`;
- sets `cache: 'no-store'` for all BFF-to-FastAPI calls;
- forwards only `Accept: application/json` and `Content-Type: application/json` when body exists;
- never logs backend URL, skill content, diff preview, request body or secret-bearing headers.

## Client adapter shape
Refactor existing `apps/web/src/modules/skills/api/skills-http.ts` to become a same-origin browser adapter.

Required properties after Phase 12.3h:

- no `process.env.NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL`;
- no backend absolute URL;
- calls only `/api/control-panel/skills...`;
- keeps `SkillsApiError` or equivalent semantic client error;
- surfaces sanitized messages only;
- continues to export the same high-level functions where possible:
  - `fetchSkillsCatalog()`;
  - `fetchSkillsAudit()`;
  - `fetchSkillDetail(skillId)`;
  - `fetchSkillPreview(skillId, payload)`;
  - `updateSkill(skillId, payload)`.

`getSkillsApiBaseUrl()` should be removed or replaced by a non-sensitive same-origin readiness indicator. Browser UI must not display backend base URLs.

## BFF validation rules

### `skillId`
Validate route param before forwarding.

Allowed pattern:

```text
^[a-z0-9][a-z0-9_-]{0,79}$
```

Reject invalid params with sanitized `400` and code `validation_error`.

Do not attempt path normalization. A value that needs normalization is invalid.

### Methods
Each route handler accepts only its declared method.

Unsupported methods should return sanitized `405` with `Allow` header where Next route handler structure makes this practical.

### Content-Type
For `POST` and `PUT`:

- require `Content-Type: application/json` compatible with optional charset;
- reject anything else with `415 unsupported_media_type`;
- never parse multipart, form-data or text payloads.

### Body size
Before parsing JSON in `POST` and `PUT`, enforce a conservative BFF request body cap.

Recommended cap for Phase 12.3h: **256 KiB**.

Rationale: FastAPI currently accepts skill payloads up to 200,000 bytes, plus JSON overhead. The BFF cap should be just above backend content cap but small enough to avoid accidental large body handling in Next.

Reject larger bodies with sanitized `413 validation_error`.

### JSON schema
Validate request body shape at the BFF before forwarding:

Preview body:

```ts
{
  content: string // non-empty, max 200_000 UTF-8 bytes, no NUL
  expected_sha256: string // exactly 64 lowercase/uppercase hex chars
}
```

Update body:

```ts
{
  actor: string // non-empty, trimmed length <= 120
  content: string // non-empty, max 200_000 UTF-8 bytes, no NUL
  expected_sha256: string // exactly 64 lowercase/uppercase hex chars
}
```

The BFF validation is a guardrail, not the source of truth. FastAPI must keep enforcing the same write policy.

### Error sanitization
Browser responses from the BFF should use a narrow envelope:

```ts
{
  detail: {
    code: string
    message: string
  }
}
```

Allowed browser-visible codes:

- `not_configured`
- `validation_error`
- `unsupported_media_type`
- `stale`
- `forbidden`
- `not_found`
- `source_unavailable`
- `upstream_unavailable`
- `http_<status>` for sanitized unexpected upstream status

Never include:

- backend base URL;
- stack traces;
- raw upstream errors;
- local filesystem paths beyond already-contractual `repo_path` fields returned by FastAPI;
- skill content in error details;
- request body;
- diff preview in logs.

## Logging policy
Phase 12.3h should not add request-body logging.

If logging is added later, it may include only:

- route name;
- method;
- status;
- sanitized error code;
- skill_id after validation;
- duration.

It must not include content, diff previews, expected hashes, backend URL, local resolved paths, tokens or cookies.

## Cache policy
- Every BFF route should use `cache: 'no-store'` when fetching upstream.
- Route handlers should export dynamic/no-store configuration if needed to prevent static caching.
- Preview and update are inherently non-cacheable.
- Catalog/detail/audit should also be no-store in this control-plane context because they reflect local files and audit state.

## Origin, cookies and CSRF
Current MVP has no cookie-based auth model in this surface.

Phase 12.3h should not invent auth, but it must avoid making future auth harder:

- do not forward browser cookies to FastAPI by default;
- do not forward arbitrary Authorization headers from the browser;
- do not set `credentials: 'include'` in client fetches;
- keep same-origin BFF endpoints under the app origin;
- if future auth uses cookies, add Origin/CSRF validation before treating same-origin BFF write routes as protected.

## Frontend migration plan for Phase 12.3h
1. Add server-only BFF adapter and route handlers.
2. Add unit/static guardrails for forbidden `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` use in skills browser adapter/copy.
3. Refactor `skills-http.ts` to same-origin endpoints.
4. Update `/skills/page.tsx` operational copy:
   - replace public-env copy with server-only/same-origin BFF copy;
   - remove display of API base URL;
   - keep existing client UX and state machine unless implementation requires small wording changes.
5. Run happy-path smoke for catalog/detail/audit.
6. Run preview/update smoke against local FastAPI only if the local editable allowlist is safe for that test, then restore content or use a temporary test fixture if available.

## Guardrail expected in Phase 12.3h
Add a script such as:

```bash
npm run verify:skills-server-only
```

It should fail if:

- `apps/web/src/modules/skills/api/skills-http.ts` reads `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` or `process.env`;
- `/skills/page.tsx` displays backend base URL values;
- browser-side skills code imports the server-only adapter;
- the server-only adapter does not import `server-only`;
- route handlers are missing the expected allowlisted endpoints;
- `MUGIWARA_CONTROL_PANEL_API_URL` is absent from the server-only adapter;
- route handlers or server adapter contain obvious generic-proxy patterns such as forwarding arbitrary `path`, `url`, `target` or `method` from user input.

## Verify expected for Phase 12.3h
Minimum:

```bash
npm run verify:skills-server-only
npm run verify:memory-server-only
npm run verify:mugiwaras-server-only
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py
```

Targeted BFF tests/checks should cover:

- missing `MUGIWARA_CONTROL_PANEL_API_URL` returns sanitized `not_configured`;
- invalid backend URL scheme returns sanitized `not_configured` or `upstream_unavailable`, not 500;
- invalid `skillId` rejects before upstream fetch;
- wrong method/content-type/body size rejects;
- stale `expected_sha256` propagates as semantic `stale`;
- forbidden non-editable update propagates as semantic `forbidden`;
- browser bundle no longer needs the FastAPI base URL.

## Reviewer routing
- **Chopper:** required. This phase designs the security boundary for the only write-capable MVP surface.
- **Franky:** required. This phase affects runtime config, Next route handlers, no-store behaviour, local smoke and future guardrails.
- **Usopp:** not required for this design-only PR. Add Usopp only in Phase 12.3h if visible UX/copy changes become material.

## Non-goals
- No implementation of BFF route handlers in this phase.
- No auth/session redesign.
- No new write capability.
- No change to the FastAPI allowlist policy.
- No generic filesystem browser.
- No exposure of backend URL, `.env`, tokens, cookies, raw logs, skill dumps or internal stack traces.

## Acceptance criteria for this design phase
- The design chooses one BFF pattern.
- Exact route handlers are listed.
- Validation rules for `skillId`, method, `Content-Type`, body size and body schema are explicit.
- Error sanitization and logging policy are explicit.
- Phase 12.3h has a clear implementation order and verify list.
- Chopper and Franky review this design before implementation starts.

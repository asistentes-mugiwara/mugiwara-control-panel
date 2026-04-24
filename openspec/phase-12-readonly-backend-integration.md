# Phase 12 — read-only backend integration block

## Goal
Convert the non-`skills` MVP surfaces from frontend-only fixtures into safe API-backed read-only verticals, without opening new write capabilities and without exposing host-sensitive data.

## Why now
- Phase 9 already proved the real backend path for `skills`, including allowlist, audit and frontend integration.
- Phases 10 and 11 hardened the frontend shell, state clarity, accessibility, responsive behaviour and visual verify baseline.
- The remaining MVP gap is that `dashboard`, `mugiwaras`, `memory`, `vault` and `healthcheck` still rely primarily on frontend fixtures. Phase 12 should move them behind the backend frontier in controlled slices.

## Operating principles
- Backend remains the security boundary: deny-by-default, explicit allowlists, no arbitrary filesystem access and no raw host output.
- Each subphase must be small, testable and independently committable.
- Prefer backend tests first for each new API surface, then frontend adapter integration.
- Keep fixture-first semantics where the real source is not yet safe or stable, but locate fixtures/adapters behind backend services rather than directly in route pages.
- Preserve the existing six-route shell. Do not introduce a landing page, admin console or new write surfaces.
- Public repo hygiene remains mandatory: no `.env`, logs, local memory snapshots, healthcheck dumps, credentials or runtime artifacts.

## Out of scope for Phase 12
- New editable surfaces outside `skills`.
- Real shell/systemd/Docker control operations.
- Raw filesystem browsing of the vault or skills tree.
- Full authentication/authorization layer, unless required as a thin documented placeholder.
- Heavy visual regression framework; reuse the current visual baseline unless a subphase proves automation is necessary.

## Subphases

### 12.1 — shared read-only API contracts foundation
**Purpose:** define the safe response contracts that all non-`skills` read-only modules will use.

**Scope:**
- Add/extend contracts in `packages/contracts` for `mugiwaras`, `memory`, `vault`, `healthcheck` and `dashboard/system` summaries.
- Align contracts with `docs/read-models.md` and the existing `resource/status/data/meta` envelope.
- Add backend/shared helpers only where they reduce duplication without hiding security decisions.
- Add minimal tests proving envelope shape and semantic status conventions.

**Definition of done:**
- Contract types exist and compile.
- Backend can serialize at least one sample resource per new contract family.
- No endpoint with filesystem or host access is introduced yet.
- Docs/read-models are updated if field names drift.

**Verify expected:**
- backend unit tests for contract/envelope samples.
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build`.
- `git diff --check`.

### 12.2 — `mugiwaras` read-only API vertical
**Purpose:** make the crew surface the first simple non-`skills` API-backed vertical.

**Scope:**
- Add backend module `mugiwaras` with `GET /api/v1/mugiwaras` and, if still small, `GET /api/v1/mugiwaras/{slug}`.
- Source only allowlisted static identity metadata, crest paths and safe status/signals.
- Move or mirror the existing frontend `mugiwara.card` fixture behind an API/service boundary.
- Add frontend client adapter and keep graceful fallback/error states.

**Definition of done:**
- `/mugiwaras` renders from backend data when API URL is configured.
- Unknown slug returns controlled semantic error, not stack trace or filesystem detail.
- Crest paths remain public-safe and aligned with existing assets.

**Verify expected:**
- backend tests for catalog, detail and unknown slug.
- frontend typecheck/build.
- API + web smoke for `/mugiwaras`.
- visual baseline route review for desktop/mobile if layout changes.

### 12.3 — `memory` read-only API vertical
**Purpose:** expose safe memory summaries through backend without leaking raw memory stores.

**Scope:**
- Add backend module `memory` with summary list and optional agent detail endpoint.
- Return only allowlisted summaries/facts/counts/statuses already safe for UI.
- Represent unavailable sources as `not_configured`, `stale` or `error` states, never as raw exceptions.
- Integrate `/memory` frontend with the backend adapter while preserving clear read-only affordance.

**Definition of done:**
- `/memory` can render API-backed summaries and detail-like content safely.
- Built-in/Honcho distinction remains visible; Engram is not silently merged into this surface.
- No raw memory dumps, prompts, internal IDs or secrets are exposed.

**Verify expected:**
- backend tests for ready/unavailable/error-shaped responses.
- frontend typecheck/build.
- smoke against configured API.
- `git diff --check`.

### 12.4 — `vault` read-only API vertical
**Purpose:** introduce a safe vault reader with explicit allowlist and path normalization.

**Scope:**
- Add backend module `vault` for index/tree and document read endpoints.
- Restrict reads to the canonical vault root and an explicit safe subset of paths/categories.
- Reject path traversal, absolute paths, symlinks and unsupported file types.
- Integrate `/vault` frontend with backend index/document data where the scope remains small.

**Definition of done:**
- Vault index is backend-backed and safe-by-default.
- Document reads are markdown-only and allowlisted.
- Rejections use semantic errors without leaking host paths beyond safe display paths.

**Verify expected:**
- backend tests for allowed read, traversal rejection, unknown document and unsupported extension.
- frontend typecheck/build.
- visual baseline if the document layout changes materially.
- `.gitignore` audit for generated caches or snapshots.

### 12.5 — `healthcheck` and `dashboard` aggregation APIs
**Purpose:** backend-own operational summaries before the dashboard aggregates them.

**Scope:**
- Add `healthcheck` read-only module returning sanitized module cards/events/summary.
- Add `dashboard` or `system` aggregation endpoint that composes only safe summaries and links.
- Avoid shelling out or reading live host internals unless each source is separately allowlisted and sanitized.
- Integrate `/healthcheck` and `/dashboard` with backend adapters.

**Definition of done:**
- `healthcheck` exposes safe status data without raw command output.
- `dashboard` consumes backend-owned summaries rather than duplicating frontend-only fixture logic.
- Stale/error states are explicit and visible.

**Verify expected:**
- backend tests for normal, stale and unavailable source states.
- frontend typecheck/build.
- API + web smoke for `/dashboard` and `/healthcheck`.
- visual baseline matrix for the two routes.

### 12.6 — integration hardening, docs and block closeout
**Purpose:** close Phase 12 as a coherent backend-integration block rather than a set of isolated endpoints.

**Scope:**
- Add or update a lightweight integration smoke script if useful: API health + representative read-only endpoints + frontend build.
- Update `docs/api-modules.md`, `docs/read-models.md`, `docs/development.md` and frontend handoff only where reality changed.
- Review `.gitignore` after backend/runtime changes.
- Run the current visual baseline and document manual findings.
- Consider `judgment-day` if vault/memory/healthcheck exposure risk feels high after implementation.

**Definition of done:**
- All Phase 12 read-only surfaces have documented contracts, tests and frontend integration status.
- Known remaining fixture-backed areas are explicitly named, not hidden.
- Verify evidence is recorded in `openspec`/`.engram`.
- Branches/commits are clean, pushed and traceable with Zoro trailers.

**Verify expected:**
- backend test suite.
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build`.
- `npm run verify:visual-baseline`.
- `git diff --check`.
- targeted manual smoke of API-backed routes.

## Recommended execution order
1. 12.1 contracts foundation.
2. 12.2 `mugiwaras` vertical as low-risk pattern proof.
3. 12.3 `memory` vertical, with stricter leak review.
4. 12.4 `vault` vertical, with path traversal tests before implementation.
5. 12.5 `healthcheck` + `dashboard` aggregation.
6. 12.6 block closeout and hardening.

## Risk register
- **Vault path traversal / accidental host exposure:** mitigate with tests before implementation, allowlist-only reads and no path supplied directly as filesystem authority.
- **Memory leakage:** expose summaries and counts only; never raw memory stores, prompts or relational context dumps.
- **Healthcheck overreach:** summarize safe states; do not turn this into a remote admin console.
- **Frontend fallback ambiguity:** clearly distinguish `not_configured`, `empty`, `stale` and `error`.
- **Fixture drift:** once a surface is API-backed, keep fixtures either backend-owned for safe sample data or explicitly marked as frontend fallback/test data.

## Branching and closure policy
- Use `zoro/phase-12-<subphase-slug>` for implementation subphases unless the change is documentation-only and already on a controlled planning branch.
- Each subphase should close with its own spec/checklist, `.engram` closeout, verify evidence, commit and push.
- Use commit trailers:
  - `Mugiwara-Agent: zoro`
  - `Signed-off-by: zoro <asistentes.mugiwara@gmail.com>`

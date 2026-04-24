# Phase 12.2 — mugiwaras API vertical + canonical AGENTS.md

## Scope
Make `/mugiwaras` the first non-`skills` API-backed read-only vertical and include the canonical Mugiwara operating rules document in that same section.

## Decision: include AGENTS.md now
The AGENTS.md requirement belongs in Phase 12.2, not later, because:
- the requested page/section is Mugiwara, which maps to the existing `/mugiwaras` surface;
- Phase 12.2 already creates the backend-owned boundary for this surface;
- reading `/srv/crew-core/AGENTS.md` must be allowlisted server-side, not implemented as a frontend-only shortcut;
- delaying it would leave the Mugiwara section API-backed but missing its canonical operating document.

## SDD summary
### Explore
- Phase 12.1 already added shared read-only contracts and backend envelope validation.
- `/mugiwaras` was still frontend fixture-backed.
- Franky's handoff states that only `/srv/crew-core/AGENTS.md` should be shown, read-only, and `/home/agentops/.hermes/hermes-agent/AGENTS.md` must not be listed separately because it is now a symlink to the canonical file.

### Design
- Add backend module `apps/api/src/modules/mugiwaras` with:
  - `GET /api/v1/mugiwaras`
  - `GET /api/v1/mugiwaras/{slug}`
- Keep data static and allowlisted for this microphase.
- Read exactly the canonical crew rules document from `/srv/crew-core/AGENTS.md`.
- Reject symlink-backed AGENTS reads at file and parent-component level in service tests to prevent treating the Hermes Agent symlink as an independent source.
- Document that full AGENTS markdown belongs behind the private control-plane boundary/auth perimeter if the API is ever exposed beyond trusted operation.
- Extend shared TypeScript contracts with `CrewRulesDocument`.
- Update `/mugiwaras` to prefer backend data when `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` is configured, with a sane fixture fallback and no AGENTS content when backend is unavailable.

## Tasks
- [x] Add backend tests for mugiwaras catalog, detail, unknown slug and symlink rejection.
- [x] Add `mugiwaras` backend module and include router in FastAPI app.
- [x] Extend contracts and docs for the canonical crew rules document.
- [x] Add frontend read-only API adapter and update `/mugiwaras` page.
- [x] Preserve no-write scope and public repo hygiene.

## Definition of done
- `/api/v1/mugiwaras` returns crew cards plus `crew_rules_document` for `/srv/crew-core/AGENTS.md`.
- `/api/v1/mugiwaras/{slug}` returns a safe profile for known slugs.
- Unknown slugs return semantic 404 without leaking host paths.
- Symlink AGENTS source is rejected in tests, including parent-directory symlink components.
- `/mugiwaras` improves document legibility with a local read-only badge, keyboard-focusable scroll region and explicit scroll hint.
- `/mugiwaras` can render API-backed data and shows the AGENTS.md content only when backend data is available.

## Files changed
- `apps/api/src/modules/mugiwaras/*` — new backend read-only module.
- `apps/api/src/main.py` — includes mugiwaras router.
- `apps/api/tests/test_mugiwaras_api.py` — endpoint/security tests.
- `packages/contracts/src/read-models.ts` — `CrewRulesDocument` and updated mugiwaras response contracts.
- `apps/web/src/modules/mugiwaras/api/mugiwaras-http.ts` — frontend API adapter.
- `apps/web/src/modules/mugiwaras/view-models/*` — fixture/status alignment with shared severity.
- `apps/web/src/app/mugiwaras/page.tsx` — API-backed read-only page with canonical AGENTS panel.
- `docs/api-modules.md` and `docs/read-models.md` — updated module/read-model docs.

## Reviewer routing
This PR should request mixed review:
- Chopper: fixed filesystem read, symlink rejection, no arbitrary path access.
- Usopp: visible UI/UX change on `/mugiwaras` showing AGENTS.md.
- Franky: optional/secondary because the document is operational canon, but no runtime/deploy scripts are changed.

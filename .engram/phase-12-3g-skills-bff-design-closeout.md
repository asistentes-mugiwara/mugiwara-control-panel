# Phase 12.3g closeout — Skills BFF / server-side design

## Goal
Design the server-side BFF boundary for migrating `/skills` away from public backend URL config without implementing runtime changes yet.

## Decision
Use Next.js route handlers under `/api/control-panel/skills/**` as a same-origin BFF in Phase 12.3h.

Do not use server actions in this pass. Route handlers fit the current client-heavy `/skills` page with less UI churn and allow a precise endpoint allowlist.

## Key constraints for 12.3h
- No generic proxy.
- Server-only adapter must read `MUGIWARA_CONTROL_PANEL_API_URL` and import `server-only`.
- Browser adapter must call same-origin `/api/control-panel/skills...` endpoints only.
- Validate `skillId`, method, content type, body size and payload schema before forwarding writes.
- Use `cache: no-store` on upstream fetches.
- Do not forward cookies or arbitrary Authorization headers from the browser.
- Never log backend URL, skill contents, diff previews, request bodies, expected hashes or tokens.
- FastAPI remains the source of truth for allowlist, path safety, stale hash and audit policy.

## Review needed before implementation
- Chopper: security boundary for the only write-capable MVP surface.
- Franky: runtime config, Next route handlers, guardrails and operational smoke.

## Files
- `openspec/phase-12-3g-skills-bff-design.md`
- `openspec/phase-12-3g-skills-bff-design-verify-checklist.md`
- `docs/runtime-config.md`
- `.engram/phase-12-3g-skills-bff-design-closeout.md`

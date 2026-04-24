# Phase 12.6c — Block closeout and canon refresh

## Goal
Close Phase 12 as a coherent read-only backend integration block and refresh the canonical project summary after the integration smoke/visual baseline evidence recorded in Phase 12.6b.

## Why now
Phase 12.1–12.5 moved the non-`skills` MVP surfaces behind safe backend-owned read-only APIs. Phase 12.6a closed targeted follow-ups, docs and guardrails; Phase 12.6b verified the integrated API/web runtime and visual baseline. The remaining work is not new runtime functionality, but durable closeout: summarize the block, keep the vault Project Summary aligned with reality, and leave the next track explicit.

## Scope
- Record Phase 12 block closeout in OpenSpec.
- Refresh the canonical vault `Project Summary - Mugiwara Control Panel`.
- Record project-local continuity in `.engram/phase-12-6c-closeout.md`.
- Reconcile open GitHub issues for the block without hiding future hardening work.
- Run lightweight closeout verification appropriate for documentation/canon changes.

## Out of scope
- New product functionality or route changes.
- Additional backend connectors for live host health sources.
- Dependency advisory remediation for #17.
- Auth, deployment, write-surface changes, Playwright or automated visual regression infrastructure.
- Re-running the full API/web smoke already captured in Phase 12.6b unless closeout edits touch runtime code.

## Phase 12 outcome
Phase 12 is considered functionally closed after 12.6c because the MVP routes now have these backend/frontend boundaries:

| Surface | Backend/API state | Frontend state | Closeout note |
| --- | --- | --- | --- |
| `mugiwaras` | `GET /api/v1/mugiwaras` and detail endpoint are backend-owned, read-only and allowlisted. | `/mugiwaras` uses server-only backend config and remains dynamic. | Fixed AGENTS.md canonical excerpt is intentional approved read-only product content. |
| `memory` | `GET /api/v1/memory` and detail endpoint expose sane memory summaries only. | `/memory` uses server-only backend config and dynamic rendering. | No raw prompts, observation IDs, sessions or memory dumps. |
| `vault` | `GET /api/v1/vault` and document endpoint use allowlisted markdown reads with traversal/symlink rejection. | `/vault` uses server-only backend config and visible degraded fallback. | No write surface in MVP. |
| `dashboard` | `GET /api/v1/dashboard` aggregates backend-owned safe summaries. | `/dashboard` uses server-only backend config and dynamic rendering. | Healthcheck not configured degrades to warning/stale, not healthy silence. |
| `healthcheck` | `GET /api/v1/healthcheck` returns a sanitized backend-owned catalog. | `/healthcheck` uses server-only backend config and dynamic rendering. | No shell, Docker, systemd, logs, stdout/stderr or raw host reads yet. |
| `skills` | Existing allowlisted read/preview/update backend remains the only MVP write surface. | `/skills` uses same-origin BFF route handlers; browser never receives backend base URL. | BFF is not a generic proxy. |

## Verification basis
Phase 12.6c relies on the Phase 12.6b runtime evidence for integration smoke and adds closeout/canon verification only:

- Phase 12.6b passed all server-only guardrails.
- Phase 12.6b passed frontend typecheck and production build.
- Phase 12.6b passed full Phase 12 backend regression: 27 tests.
- Phase 12.6b smoked API endpoints and canonical web routes in dev and production.
- Phase 12.6b browser console review found no uncaught runtime errors.
- Phase 12.6b visual baseline review found no blocking layout regression.

## Issues after closeout
- #16 remains open intentionally for future Healthcheck/Dashboard hardening that was not part of the Phase 12 closeout: real-source timestamp parsing, real `critical` severity aggregation and possible backend host allowlist.
- #17 remains open intentionally as a separate dependency/security maintenance track for the existing Next/PostCSS moderate advisory.

## Definition of done
- This OpenSpec closeout exists and states the Phase 12 outcome clearly.
- Vault Project Summary reflects Phase 12 as closed and names the current backend/server-only state.
- `.engram/phase-12-6c-closeout.md` captures continuity for the next session.
- GitHub issues are reconciled by comment/state rather than silently ignored.
- `git diff --check` passes for repository changes.
- Markdown/canon files contain no secrets, runtime dumps, `.env` content or sensitive logs.

## Review routing
Phase 12.6c is documentation/canon closeout, but it summarizes security and runtime surfaces. Request:

- Franky: operational/runtime accuracy of the block closeout and next-step issues.
- Chopper: security boundary accuracy and no unsafe public/canonical leakage.

Usopp is not required unless reviewers flag a visual/UX documentation concern; Phase 12.6c does not change UI.

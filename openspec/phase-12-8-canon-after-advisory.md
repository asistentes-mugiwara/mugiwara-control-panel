# Phase 12.8 — Canon refresh after Next/PostCSS advisory

## Goal
Close the canonical documentation gap left after issue #17 was resolved by PR #21, without introducing runtime changes.

## Why now
Phase 12.6c deliberately left #17 open as a separate dependency/security maintenance track. PR #21 has now closed that track by mitigating the existing Next/PostCSS advisory, so the project canon must stop listing #17 as pending and should point the next implementation block at Phase 13.

## Scope
- Record that issue #17 is closed by PR #21.
- Keep issue #16 open as the only known GitHub follow-up for future Healthcheck/Dashboard hardening.
- Refresh the vault `Project Summary - Mugiwara Control Panel` so it reflects the current state after Phase 12.7.
- Record project-local continuity in `.engram/phase-12-8-canon-after-advisory.md`.
- Run lightweight verification suitable for documentation/canon edits.

## Out of scope
- Runtime code changes.
- Dependency changes beyond the already-merged PR #21.
- Healthcheck real-source implementation.
- Auth, exposure, BFF hardening, CI or visual regression work.
- Re-running the full Phase 12 smoke unless documentation edits unexpectedly touch runtime.

## Canon updates
- Phase 12 read-only backend integration remains closed.
- Phase 12.7 dependency/security follow-up is closed: `postcss` is pinned to `8.5.10` via npm override while staying on `next@15.5.15` for Node `v18.19.1` compatibility.
- #17 is closed and no longer belongs in open follow-ups.
- #16 remains open for a future Healthcheck/Dashboard hardening track: explicit timestamp parsing for real sources, real `critical` severity aggregation and possible backend host allowlist.
- Recommended next block remains Phase 13: perimeter/auth/BFF hardening before connecting more real host sources.

## Definition of done
- This OpenSpec note exists and states the canonical state after #17.
- The vault Project Summary no longer lists #17 as open.
- `.engram/phase-12-8-canon-after-advisory.md` captures continuity for the next session.
- `git diff --check` passes in the project repo and vault repo.
- `npm run audit:web` still reports zero vulnerabilities after the canon refresh baseline.
- No secrets, `.env`, runtime dumps, logs or sensitive host details are introduced.

## Review routing
This is documentation/canon only and does not change runtime, dependencies, security boundaries or UI. External reviewer handoff is not required unless the diff expands beyond canon refresh.

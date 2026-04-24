# Phase 13.1 planning closeout

Date: 2026-04-24

## What changed
- Added `openspec/phase-13-1-security-perimeter-plan.md`.
- Added `openspec/phase-13-1-planning-verify-checklist.md`.
- Decided Phase 13 must be split into focused subphases instead of one large hardening PR.

## Decision
Phase 13 is a security/perimeter block and should be implemented as:
1. Phase 13.1 — planning/design.
2. Phase 13.2 — perimeter contract and runtime policy.
3. Phase 13.3 — Skills BFF write-route hardening.
4. Phase 13.4 — backend/API perimeter headers and sanitized errors.
5. Phase 13.5 — block smoke and canon closeout.

## Why
`/skills` is the only MVP write-capable surface, and future Healthcheck real-source work (#16) would expand host-adjacent risk. The safer order is to settle perimeter/auth/BFF guardrails before connecting additional real host sources.

## Continuity
- Chopper should review the security boundary and Origin/CSRF/auth assumptions.
- Franky should review runtime/private deployment assumptions and verify strategy.
- Usopp is not required unless future subphases alter visible UI/copy.

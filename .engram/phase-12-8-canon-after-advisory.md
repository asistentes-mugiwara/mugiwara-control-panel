# Phase 12.8 closeout — canon after #17

Date: 2026-04-24

## What changed
- Added `openspec/phase-12-8-canon-after-advisory.md` to record the canonical state after issue #17 was closed.
- Refreshed the vault `Project Summary - Mugiwara Control Panel` so it no longer lists #17 as open and points next work at Phase 13 perimeter/auth/BFF hardening.

## Why
Phase 12.6c intentionally left #17 open as a separate dependency/security maintenance track. PR #21 closed that track, so project canon needed a small follow-up to avoid stale guidance.

## Current follow-ups
- #16 remains open: future Healthcheck/Dashboard hardening for real sources.
- #17 is closed: Next/PostCSS advisory mitigated via `overrides.postcss = 8.5.10` and reproducible `npm run audit:web`.

## Recommended next block
Phase 13 should plan and implement perimeter/auth/BFF hardening before connecting additional real host health sources.

# Phase 16.4 — Dashboard timestamp and metric grid polish

## Issue
GitHub #47 — Polish Dashboard timestamps and metric grid balance.

## Decision on split
No further split is required.

Reasoning:
- The issue is frontend/UI polish only.
- It touches a single route (`/dashboard`) plus one shared CSS layout rule file.
- There is no backend, API contract, dependency, security, runtime config or data model change.
- The two requested changes are tightly coupled to the same Dashboard surface and can be verified together with web typecheck/build and visual baseline.

This remains a single bounded microphase: Phase 16.4.

## Goal
Make Dashboard feel consistent with the rest of the product by:
1. rendering freshness timestamps through Spanish locale formatting instead of raw ISO text;
2. making the four primary metric cards render as an intentional 4-up / 2x2 / 1-column layout instead of an accidental orphan card.

## Scope
Included:
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/globals.css`
- OpenSpec and Engram closeout for continuity.

Out of scope:
- new Dashboard modules;
- issue #36 header metrics;
- backend/API/read-model changes;
- Healthcheck live-source work;
- broader responsive redesign.

## Implementation notes
- Add a local Dashboard `formatTimestamp()` helper matching existing page patterns with `Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' })`.
- Use `Fecha no disponible` if the timestamp cannot be parsed.
- Replace the generic `layout-grid--cards-260` for the primary metrics with a Dashboard-specific grid class.
- The metrics grid is:
  - 4 columns when desktop width allows;
  - 2 columns under 1180px;
  - 1 column under 640px.

## Definition of Done
- Dashboard no longer shows raw ISO freshness timestamps as primary UI copy.
- Formatting is consistent with existing `healthcheck`, `memory` and `vault` patterns.
- Four primary metrics avoid the 3+1 orphan layout on desktop/tablet.
- No horizontal overflow is introduced by the metric grid.
- `npm --prefix apps/web run typecheck` passes.
- `npm --prefix apps/web run build` passes.
- `npm run verify:visual-baseline` includes `/dashboard` and passes.
- Usopp review is requested because this is UI/visual polish.

## Risks
- The formatted date is locale-dependent. This is intended and aligned with existing Spanish UI.
- The 4-up grid may make cards narrower on some mid-desktop widths; the 2-column breakpoint reduces that risk.

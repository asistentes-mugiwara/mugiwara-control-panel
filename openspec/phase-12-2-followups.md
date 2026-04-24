# Phase 12.2 followups — AGENTS viewer polish

## Scope
Close the low-risk followups accepted during PR #3 review before starting Phase 12.3.

## Decision: polish before Phase 12.3
Phase 12.3 targets the more sensitive `memory` vertical. The safer sequence is to first close the small UI/accessibility/copy followups from Phase 12.2 while the context is fresh, then enter the next backend vertical with a clean baseline.

## Tasks
- [x] Align the AGENTS `<pre>` focus state with the global 3px blue focus ring.
- [x] Add a visible/styled scrollbar affordance to the canonical document viewer.
- [x] Replace the mixed-language `Crests activos` pill with `Emblemas activos`.
- [x] Keep the change frontend-only and avoid changing backend/security behavior.

## Out of scope
- No Phase 12.3 `memory` backend implementation.
- No auth/perimeter changes.
- No changes to the AGENTS filesystem read contract.

## Definition of done
- Keyboard focus on the AGENTS viewer is visually consistent with global focus states.
- The scrollable document region has a visible scrollbar affordance.
- Header copy is fully Spanish for the active emblem pill.
- Typecheck/build pass.
- `git diff --check` passes.

## Reviewer routing
This is a small visible frontend followup. Usopp review is appropriate. Franky/Chopper are not required unless the diff expands beyond CSS/copy.

# Phase 19.2 — Skills picker reader/editor

## Context
Pablo rejected the previous `/skills` layout because it still exposed long lists and non-actionable informational containers. The target UX is a compact mobile-friendly flow: choose a source, choose a skill, then read or edit that skill in one focused window.

## Goals
- Remove non-actionable informational containers from `/skills`.
- Avoid showing an infinite list of global skills by default.
- Let the user select either `global` or a Mugiwara as the active source.
- Show a filtered skill dropdown for the selected source.
- Open a single reader/editor window for the selected skill.
- Let the user switch between reader and editor modes.
- Render Markdown in reader mode.
- Preserve the existing same-origin BFF and backend allowlist security model.

## Non-goals
- No new backend write surface.
- No arbitrary filesystem browsing from the browser.
- No bulk skill operations.
- No public exposure of backend URL or raw server paths beyond existing metadata contract.

## Implementation notes
- `/skills` is client-side for source/skill selection and reader/editor state.
- Skill content still comes from the existing BFF endpoints.
- Markdown rendering is intentionally local and conservative for headings, lists, paragraphs, code blocks and inline formatting.
- The editor path keeps preview/save controls and audit metadata from the existing MVP.

## Verification
- TypeScript typecheck.
- Next.js production build.
- API regression tests for skills and Mugiwaras.
- BFF guardrail check.
- Visual baseline checklist plus browser smoke on `/skills?mugiwara=franky`.
- Console clean during browser smoke.

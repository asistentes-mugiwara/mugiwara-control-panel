# Phase 19.2 closeout — Skills picker reader/editor

## Context
Pablo reported that `/skills` still felt like an infinite global list and that the informational containers did not add value. The requested interaction is source selection, skill dropdown, and one reader/editor window with Markdown rendering in reader mode.

## Changes
- Reworked `/skills` into a compact source + skill picker flow.
- Removed non-actionable informational containers from the page.
- Added a filtered skill dropdown for `global` or the selected Mugiwara source.
- Added a focused reader/editor window for the selected skill.
- Added reader/editor mode toggle.
- Added conservative Markdown rendering for reader mode.
- Kept editor/preview/save path behind the existing BFF same-origin model.
- Updated skills surface docs and OpenSpec phase notes.

## Verification
- `npm --prefix apps/web run typecheck` passed.
- `npm --prefix apps/web run build` passed.
- `PYTHONPATH=. pytest apps/api/tests/test_skills_api.py apps/api/tests/test_mugiwaras_api.py -q` passed: 12 tests.
- `npm run verify:skills-server-only` passed.
- `npm run verify:visual-baseline` completed.
- `git diff --check` passed.
- Browser smoke on `http://127.0.0.1:3020/skills?mugiwara=franky` confirmed no old containers, source selector, skill dropdown, Markdown reader and editor toggle; console clean.

## Notes
The Markdown renderer is intentionally conservative and local. It is sufficient for readable `SKILL.md` content without expanding the dependency surface in this microphase.

# Phase 19.2 verify checklist — Skills picker reader/editor

## Functional
- [x] Old informational containers `Contrato`, `Enlace` and `Rastro` are absent from `/skills`.
- [x] Source selector includes `Globales` and each Mugiwara source with counts.
- [x] Skill selector is filtered by the selected source.
- [x] Selecting `global` changes the skill list to global skills only.
- [x] Selecting a skill opens a focused reader/editor window.
- [x] Reader mode renders Markdown headings, lists, paragraphs and code blocks.
- [x] Editor mode remains available from the same window.

## Security / architecture
- [x] Browser still uses BFF same-origin endpoints.
- [x] Backend URL remains server-only.
- [x] No client-side filesystem path construction was introduced.
- [x] Existing backend allowlist and skill ID validation remain unchanged.

## Commands
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] `PYTHONPATH=. pytest apps/api/tests/test_skills_api.py apps/api/tests/test_mugiwaras_api.py -q`
- [x] `npm run verify:skills-server-only`
- [x] `npm run verify:visual-baseline`
- [x] `git diff --check`

## Browser smoke
- [x] Local production server on `127.0.0.1:3020` served `/skills?mugiwara=franky` with HTTP 200.
- [x] Visual inspection confirmed selector + dropdown + reader/editor window.
- [x] Console had no JavaScript errors.
- [x] Source switching to `global` produced a 15-item global skill dropdown.
- [x] Editor toggle opened editable controls.

## Pending before close
- [ ] PR review handoff.
- [ ] Merge/deploy if approved or explicitly requested.
- [ ] Production smoke after deploy.

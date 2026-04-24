# Phase 12.2 verify checklist — mugiwaras AGENTS read-only

## TDD evidence
- [x] RED: `PYTHONPATH=. pytest apps/api/tests/test_mugiwaras_api.py` failed before implementation with `ModuleNotFoundError: No module named 'apps.api.src.modules.mugiwaras'`.
- [x] GREEN: `PYTHONPATH=. pytest apps/api/tests/test_mugiwaras_api.py` passed after implementation.

## Backend verify
- [x] `python -m py_compile apps/api/src/modules/mugiwaras/domain.py apps/api/src/modules/mugiwaras/service.py apps/api/src/modules/mugiwaras/router.py apps/api/src/main.py`
- [x] `PYTHONPATH=. pytest apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py`

## Frontend/contracts verify
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`

## Integration/manual smoke
- [x] Start API and web with `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` configured.
- [x] Check `/api/v1/mugiwaras` returns `crew_rules_document.display_path == /srv/crew-core/AGENTS.md`.
- [x] Check `/mugiwaras` renders the canonical AGENTS.md panel and does not list Hermes Agent AGENTS separately.

## Hygiene
- [x] `git diff --check`
- [x] `git status --short --branch`

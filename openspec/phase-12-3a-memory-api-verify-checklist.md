# Phase 12.3a verify checklist — memory API foundation

## TDD evidence
- [x] RED: `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py` failed with `ModuleNotFoundError: No module named 'apps.api.src.modules.memory'` before implementation.
- [x] GREEN: `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py` passed after implementation.

## Backend verify
- [x] `python -m py_compile apps/api/src/modules/memory/domain.py apps/api/src/modules/memory/service.py apps/api/src/modules/memory/router.py apps/api/src/main.py`
- [x] `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py`
- [x] shared backend regression suite: `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py` → 15 passed.

## Frontend/contracts verify
- [x] Not required: frontend/contracts not touched in this microphase.

## Hygiene
- [x] `git diff --check`
- [x] `git status --short --branch`

## Review
- [ ] Open PR against `main`.
- [ ] Ask Chopper for security/leak review.

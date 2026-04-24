# Phase 12.3b verify checklist — memory frontend API integration

## Frontend/API integration
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] API-backed smoke with `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL=http://127.0.0.1:8011`.
- [x] `/memory` renders `API read-only` and API-backed Zoro built-in/Honcho content.
- [x] Browser console clean after initial load and Honcho tab interaction.

## Backend regression
- [x] `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py` → 15 passed.

## Hygiene
- [x] `git diff --check`
- [x] `git status --short --branch`

## Review
- [ ] Open PR against `main`.
- [ ] Ask Chopper for security/leak review.
- [ ] Ask Usopp for UI/UX review.

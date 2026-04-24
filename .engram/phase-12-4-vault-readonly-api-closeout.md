# Phase 12.4 closeout — Vault read-only API vertical

## Goal
Backend-back `/vault` with a safe allowlisted Vault API without opening arbitrary filesystem browsing.

## Completed
- Added backend `vault` module and tests.
- Added `GET /api/v1/vault` and `GET /api/v1/vault/documents/{document_path:path}`.
- Added server-only frontend adapter `vault-http.ts` and converted `/vault/page.tsx` to a server page feeding `VaultClient`.
- Added `npm run verify:vault-server-only`.
- Added OpenSpec artifact.

## Security notes
- Allowlist-only Markdown reads.
- Symlinks are rejected before path resolution, including symlinked allowlisted files and symlinked parent components.
- No absolute path, traversal, `~`, symlink or unsupported extension access.
- Host-sensitive lines are filtered from parsed document bodies, titles and headings/TOC.
- Errors are semantic and do not include host paths.

## Verify snapshot
- `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py apps/api/tests/test_vault_api.py` → 22 passed.
- `npm run verify:vault-server-only` OK.
- `npm run verify:memory-server-only` OK.
- `npm run verify:mugiwaras-server-only` OK.
- `npm run verify:skills-server-only` OK.
- `npm --prefix apps/web run typecheck` OK.
- `npm --prefix apps/web run build` OK with `/vault` dynamic.
- Smoke local: API `GET /api/v1/vault` returned 200 with 3 allowlisted documents; `/vault` rendered backend data with clean browser console.

## Review outcome
- PR #13 merged: https://github.com/asistentes-mugiwara/mugiwara-control-panel/pull/13
- Franky: `mergeable_with_minor_followups`; follow-up #14 opened for visible/observable degraded state when `/vault` falls back to fixture.
- Chopper: initially requested changes on symlink handling and heading/title sanitization; post-merge hardening commit `ecbbc04` fixed both and Chopper approved.

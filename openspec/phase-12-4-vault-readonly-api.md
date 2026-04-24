# Phase 12.4 — Vault read-only API vertical

## Scope
Introduce a safe backend-backed Vault reader and integrate `/vault` through server-only frontend loading.

## Implemented
- Backend module `apps/api/src/modules/vault`:
  - `GET /api/v1/vault` returns an allowlisted workspace.
  - `GET /api/v1/vault/documents/{document_path:path}` reads allowlisted Markdown only.
- Explicit allowlist of three canonical vault documents:
  - `03-Projects/Project Summary - Mugiwara Control Panel.md`
  - `00-System/Policy - Memory governance.md`
  - `06-Playbooks/Playbook - PR governance Zoro Franky Chopper Usopp.md`
- Path normalization rejects absolute paths, `~`, traversal, unsupported extensions, symlinks and unknown documents.
- Markdown parser returns a sane editorial subset and filters host-sensitive lines containing `/srv/`, `/home/`, `.env`, `token`, `secret` or `password`.
- `/vault/page.tsx` is now a server page with `force-dynamic`.
- `VaultClient` keeps the existing interactive document selection UI without reading server env.
- `apps/web/src/modules/vault/api/vault-http.ts` is server-only and reads `MUGIWARA_CONTROL_PANEL_API_URL`.
- Added guardrail `npm run verify:vault-server-only`.

## Security boundary
Vault API is read-only and deny-by-default.

It does not expose arbitrary filesystem browsing. Client-supplied paths are not authority; they must match an explicit allowlisted Markdown document after normalization.

Rejected cases return semantic errors without host path leakage.

## Verify expected
```bash
PYTHONPATH=. pytest apps/api/tests/test_vault_api.py
PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py apps/api/tests/test_vault_api.py
npm run verify:vault-server-only
npm run verify:memory-server-only
npm run verify:mugiwaras-server-only
npm run verify:skills-server-only
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
```

## Review routing
- Chopper required: filesystem/vault boundary, path traversal and leak prevention.
- Franky required: runtime/server-only frontend loading, no-store/dynamic behaviour and guardrail.
- Usopp only if visual layout changes materially; this phase preserves existing layout and swaps the data source.

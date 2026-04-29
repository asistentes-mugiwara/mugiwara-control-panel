# Issue 121.3 verify checklist

- [x] `/vault` carga `GET /api/v1/vault/tree` desde server page/adaptador server-only.
- [x] `/vault` selecciona documentos solo desde `tree.documents` backend-owned.
- [x] `/vault` carga `GET /api/v1/vault/documents/{document_path:path}` desde server page/adaptador server-only.
- [x] `VaultClient` no lee `process.env`, no usa `MUGIWARA_CONTROL_PANEL_API_URL` y no hace fetch directo al backend.
- [x] Markdown se renderiza sin `dangerouslySetInnerHTML`.
- [x] Links Markdown se limitan a `http:`, `https:`, rutas internas o anchors.
- [x] Frontmatter, tablas y fenced code tienen cobertura en fixture fallback y renderer.
- [x] Retirada UI editorial legacy: sin `Canon curado`, `Índice allowlisted`, `Metadatos`, `TOC` como panel lateral obligatorio.
- [x] Guardrail `npm run verify:vault-server-only` actualizado al contrato 121.3.
- [x] `npm run verify:vault-server-only` pasa.
- [x] `npm --prefix apps/web run typecheck` pasa.
- [x] `npm --prefix apps/web run build` pasa y `/vault` queda dinámica.
- [x] `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q` pasa.
- [x] `npm run verify:visual-baseline` pasa.
- [x] `git diff --check` pasa.
- [x] Smoke HTTP/DOM/browser confirma layout explorer+reader y ausencia de textos legacy/fugas.

# Issue 121.2 — Backend raw Markdown document reader

## Objetivo
Cerrar la segunda microfase del issue #121 añadiendo un reader backend read-only que entregue el Markdown completo de documentos permitidos del vault, sin editorializarlo en secciones ni separar frontmatter en metadata externa.

## Alcance implementado
- `GET /api/v1/vault/documents/{document_path:path}` pasa de allowlist estática legacy a lectura dinámica bajo el root backend-owned del vault.
- El endpoint acepta solo rutas relativas `.md` y devuelve:
  - `relative_path`
  - `name`
  - `markdown`
  - `updated_at`
  - `size_bytes`
  - `read_only`
- El contenido se preserva completo para render futuro: frontmatter, headings, tablas, listas y bloques de código permanecen dentro de `markdown`.
- El reader revalida la ruta en servidor y no confía en que venga del árbol 121.1.

## Seguridad / frontera
- Root fijo backend-owned; el cliente nunca puede elegir root.
- Rechaza rutas absolutas y `~`.
- Rechaza traversal y traversal codificado ya decodificado por la ruta HTTP.
- Rechaza hidden files/dirs (`.git`, `.obsidian`, `.env`, dotfiles).
- Rechaza symlinks y padres symlink.
- Rechaza no Markdown.
- Rechaza documentos oversized con `payload_too_large`.
- Errores saneados sin ruta host, traceback ni excepción cruda.

## Decisión de compatibilidad
`GET /api/v1/vault` conserva por ahora el workspace legacy con documentos parseados/editorializados para no romper la UI actual antes de 121.3. La sustitución completa de experiencia visual queda para la microfase frontend.

## Fuera de alcance
- Render Markdown frontend.
- Nuevo layout de dos columnas.
- Guardrail web `verify:vault-server-only` final.
- Escritura/edición/creación/borrado/renombrado en vault.
- Búsqueda full-text, TOC lateral o panel externo de metadata.

## Verify esperado
- `python3 -m py_compile apps/api/src/modules/vault/*.py apps/api/tests/test_vault_api.py`
- `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q`
- `git diff --check`

## Review
Chopper obligatorio por filesystem host-adjacent, lectura raw Markdown, traversal/symlink/hidden/oversized/no-leakage. Franky no aplica salvo cambios runtime/deploy/config, que esta microfase no introduce.

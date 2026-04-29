# Issue 121.2 — Verify checklist

## TDD
- [x] Test rojo de documento Markdown permitido con frontmatter, tabla y bloque de código preservados en `markdown`.
- [x] Test rojo de rechazo de hidden files/dirs, `.obsidian`, symlink, oversized, no-md, `~` y rutas absolutas.
- [x] Test existente de traversal codificado sigue pasando con error saneado.

## Implementación
- [x] `VaultService.get_document_by_path()` devuelve raw Markdown dinámico bajo root fijo.
- [x] `VaultService._resolve_reader_path()` revalida server-side ruta, root containment, hidden, symlink, existencia, tipo y tamaño.
- [x] `GET /api/v1/vault/documents/{document_path:path}` devuelve `data.markdown` y metadata mínima segura.
- [x] Workspace legacy se conserva para no romper UI antes de 121.3.

## Verify ejecutado
- [x] `python3 -m py_compile apps/api/src/modules/vault/*.py apps/api/tests/test_vault_api.py`
- [x] `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q`
- [x] `git diff --check`
- [x] Smoke TestClient dirigido.
- [ ] Revisión de diff antes de PR.

## Review pendiente
- [ ] PR abierta.
- [ ] Handoff en PR a Chopper.
- [ ] Invocación directa a Chopper.
- [ ] Comentario/review de Chopper en PR.

# Issue 121.1 — Backend Vault explorer closeout

## Resultado
Se ha materializado la primera frontera backend del rediseño `/vault`: un árbol dinámico read-only del vault canónico, expuesto por `GET /api/v1/vault/tree` y añadido como `data.explorer` al workspace existente para facilitar transición gradual del frontend.

## Decisión de corte
La microfase conserva el contrato legacy de documentos editorializados para no romper la UI actual antes de 121.2/121.3. El nuevo contrato dinámico queda disponible y probado, pero no sustituye todavía el reader ni la experiencia visual.

## Seguridad cubierta
- Root backend-owned fijo y serializado solo como `canonical_vault`.
- Rutas relativas únicamente.
- Exclusión de hidden files/dirs, `.git`, `.obsidian`, `.env`, symlinks, no Markdown y documentos oversized.
- Límites de profundidad/nodos/tamaño documentados en el payload.
- Tests negativos con fixture sintética y scan recursivo anti-leakage.
- Follow-up menor de Chopper absorbido antes del merge: el walker maneja `OSError` en `iterdir`, `is_symlink`, `resolve` e `is_dir` para degradar entradas ilegibles sin filtrar internals.

## Verify
- `python3 -m py_compile apps/api/src/modules/vault/*.py apps/api/tests/test_vault_api.py`
- `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q`
- `git diff --check`

## Continuidad
Siguiente microfase: 121.2 debe añadir el reader raw Markdown saneado reutilizando las mismas reglas de path safety. Debe rechazar traversal/absolutas/`~`/encoded traversal/symlinks/hidden/no-md/oversized y preservar frontmatter dentro del contenido Markdown.

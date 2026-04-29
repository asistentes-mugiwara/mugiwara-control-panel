# Issue 121.2 — Backend raw Markdown reader closeout

## Resultado
Se ha materializado el reader backend raw Markdown para `/vault`: `GET /api/v1/vault/documents/{document_path:path}` lee documentos `.md` dinámicos bajo root backend-owned fijo y devuelve contenido completo en `markdown` con metadata mínima segura.

## Decisión de corte
La microfase no toca la UI. `GET /api/v1/vault` conserva el workspace/documentos legacy para no romper la experiencia actual antes de 121.3. La nueva UI debe consumir el árbol 121.1 y este reader 121.2.

## Seguridad cubierta
- Rutas relativas `.md` únicamente.
- Revalidación server-side completa; no se confía en rutas emitidas por el árbol.
- Rechazo de rutas absolutas, `~`, traversal, hidden files/dirs, symlinks, no Markdown, oversized y fuera de root.
- Errores saneados sin host paths ni trazas.
- Tests sintéticos cubren frontmatter/tablas/código preservados y rechazos principales.

## Verify
- `python3 -m py_compile apps/api/src/modules/vault/*.py apps/api/tests/test_vault_api.py`
- `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q`
- `git diff --check`
- Smoke TestClient dirigido sobre documento raw permitido y rutas maliciosas.

## Continuidad
Siguiente microfase: 121.3 debe reemplazar la UI actual de `/vault` por dos columnas, consumiendo `GET /api/v1/vault/tree` y el reader raw Markdown. Debe retirar cards/textos editoriales actuales, panel de metadata externo y TOC lateral obligatorio, y pedir review Usopp + Chopper.

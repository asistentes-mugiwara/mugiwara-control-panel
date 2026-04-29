# Issue 121.1 — Backend Vault explorer tree

## Objetivo
Cerrar la primera microfase de #121 creando un contrato backend read-only para explorar el vault como árbol dinámico seguro, sin introducir todavía el lector Markdown raw ni la nueva UI de dos columnas.

## Alcance implementado
- Nuevo endpoint `GET /api/v1/vault/tree` con recurso `vault.explorer_tree`.
- `GET /api/v1/vault` conserva compatibilidad de workspace actual y añade `data.explorer` como contrato nuevo para fases frontend posteriores.
- El árbol se construye bajo root backend-owned `canonical_vault` (`/srv/crew-core/vault` en runtime), pero el payload solo devuelve rutas relativas.
- Se incluyen directorios y documentos `.md` permitidos.
- Se excluyen ficheros/directorios ocultos, `.git`, `.obsidian`, `.env`, symlinks, no Markdown, documentos oversized y entradas fuera del root.
- Se añaden límites explícitos de profundidad, número de nodos y tamaño máximo de documento referenciado.
- No se devuelve contenido Markdown en esta microfase; solo referencias y metadata mínima segura.

## Fuera de alcance
- Lectura raw del contenido Markdown (`121.2`).
- Rediseño visual de `/vault` (`121.3`).
- Responsive/guardrails frontend/canon final (`121.4`).
- Escritura, edición, creación, borrado o renombrado en vault.
- Búsqueda full-text, TOC lateral o panel externo de metadata.

## Contrato de seguridad
- `safe_root` se serializa como `canonical_vault`, nunca como ruta absoluta.
- `read_only=true` y `sanitized=true` aparecen en meta y payload.
- El cliente no puede elegir root ni ruta base.
- El backend no sigue symlinks ni padres symlink.
- La respuesta no debe contener `/srv/`, `/home/`, `.env`, `.git`, secretos, stdout/stderr/logs ni rutas absolutas.

## Verify esperado
- `python3 -m py_compile apps/api/src/modules/vault/*.py apps/api/tests/test_vault_api.py`
- `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q`
- `git diff --check`

## Review
Chopper obligatorio por filesystem host-adjacent, traversal/symlink/hidden/no-leakage. Franky no aplica salvo que se introduzcan cambios runtime/deploy/config operativa, cosa que esta microfase no hace.

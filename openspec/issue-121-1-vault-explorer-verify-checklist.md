# Issue 121.1 — Verify checklist

## TDD
- [x] Añadidos tests rojos para `GET /api/v1/vault/tree` con fixture sintética.
- [x] Añadidos tests para exclusión de `.git`, `.env`, no-md, oversized y symlink.
- [x] Añadidos tests para límites de profundidad y número de nodos.
- [x] Añadida aserción de no-leakage recursiva sobre payload.

## Implementación
- [x] Añadidos read models backend `VaultExplorerNode` y `VaultDocumentRef`.
- [x] Añadido `VaultService.get_explorer_tree()`.
- [x] Añadido endpoint `GET /api/v1/vault/tree`.
- [x] `GET /api/v1/vault` mantiene el contrato legacy y añade `data.explorer` para transición.

## Verify ejecutado
- [x] `python3 -m py_compile apps/api/src/modules/vault/*.py apps/api/tests/test_vault_api.py`
- [x] `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q`
- [x] `git diff --check`
- [ ] Revisión de diff antes de PR.

## Review pendiente
- [ ] PR abierta.
- [ ] Handoff en PR a Chopper.
- [ ] Invocación directa a Chopper.
- [ ] Comentario/review de Chopper en PR.

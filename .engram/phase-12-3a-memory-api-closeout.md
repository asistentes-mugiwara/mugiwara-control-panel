# Phase 12.3a closeout — memory API foundation

## Resultado
- Añadido módulo backend `memory` read-only.
- Añadidos endpoints `GET /api/v1/memory` y `GET /api/v1/memory/{slug}`.
- La API devuelve solo resúmenes, contadores, badges, frescura y facts Honcho saneados.
- No se leen stores reales ni se exponen prompts, IDs internos, sesiones, observaciones crudas ni secretos.

## Decisión técnica
Phase 12.3 se divide en microfases. Primero backend API foundation con frontera de fuga testeada; después vendrá integración frontend `/memory` contra API. Esto reduce riesgo porque la superficie Memory es más sensible que `mugiwaras`.

## Verify ejecutado
- RED inicial: `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py` falló por ausencia del módulo.
- GREEN: `python -m py_compile apps/api/src/modules/memory/domain.py apps/api/src/modules/memory/service.py apps/api/src/modules/memory/router.py apps/api/src/main.py && PYTHONPATH=. pytest apps/api/tests/test_memory_api.py` → 4 passed.
- Regression backend: `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py` → 15 passed.
- `git diff --check` → OK.

## Riesgos abiertos
- Los datos son backend-owned/saneados, no conexión a stores reales. La integración con memoria real debe ser otra fase con revisión de Chopper.
- Frontend `/memory` sigue fixture-backed hasta la siguiente microfase.
- Chopper debe revisar esta PR por ser frontera de exposición de memoria.

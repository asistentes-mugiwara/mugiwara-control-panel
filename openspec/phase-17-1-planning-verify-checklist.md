# Phase 17.1 planning/verify checklist

## Planning evidence
- [x] Repo real inspeccionado: `main` limpio antes de rama y issues abiertos #51/#40/#36 revisados.
- [x] Project Summary leído: features nuevas estaban pendientes y #51 es el primer bloque escogido por petición explícita de Pablo.
- [x] Fuente real inspeccionada: SQLite `/srv/crew-core/runtime/usage/codex-usage.sqlite` existe con tabla `codex_usage_snapshots` y campos saneados.
- [x] Scope dividido: 17.1 solo backend current snapshot; UI/calendario/Hermes activity quedan fuera.

## Verify evidence
- [x] Red TDD inicial: `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` falló por módulo `usage` inexistente.
- [x] Green dirigido: `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q`.
- [x] Compile dirigido.
- [x] Guardrails/docs diff check.
- [x] Smoke API vía FastAPI TestClient cubierto por `test_usage_api.py`.

## Review routing esperado
- Franky: fuente SQLite/runtime snapshot y semántica operativa.
- Chopper: no leakage de PII/raw payload y frontera host.
- Usopp: no obligatorio en 17.1 si no hay UI visible; sí desde 17.2.

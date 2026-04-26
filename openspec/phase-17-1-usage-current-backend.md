# Phase 17.1 — Usage backend current snapshot foundation

## Alcance cerrado
Phase 17.1 crea la primera frontera backend del bloque Usage:

- nuevo módulo `apps/api/src/modules/usage`;
- endpoint read-only `GET /api/v1/usage/current`;
- lectura de la SQLite saneada de Franky en ruta fija allowlisted;
- respuesta con snapshot actual, plan, ventana 5h, ciclo semanal Codex, frescura, recomendación y metodología/privacidad;
- degradación segura ante DB ausente/ilegible o snapshots antiguos.

## Decisiones
- La DB runtime no se versiona ni se copia; el backend solo lee `codex_usage_snapshots` en modo SQLite read-only.
- La respuesta no expone rutas runtime ni detalles internos del host.
- `ciclo semanal Codex` queda como etiqueta de producto para evitar confundirlo con una semana natural lunes-domingo.
- `stale` se declara si el snapshot supera 45 minutos, coherente con productor cada 15 minutos y margen de retraso operativo.
- `not_configured` representa DB ausente/ilegible/sin snapshots sin filtrar path local.

## DoD
- [x] Tests backend para snapshot ready, DB ausente y snapshot stale.
- [x] Endpoint registrado en FastAPI.
- [x] Módulo documentado con `AGENTS.md` local.
- [x] Docs `api-modules` y `read-models` actualizadas.
- [x] No se añaden acciones de escritura.

## Verify
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py`
- `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py`
- `git diff --check`

## Fuera de alcance pendiente
- Página `/usage` en frontend.
- Calendario de consumo por fecha natural.
- Ventanas 5h agregadas por día/rango.
- Actividad Hermes local agregada.
- Gráficas o proyecciones avanzadas.

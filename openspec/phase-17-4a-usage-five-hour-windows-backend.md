# Phase 17.4a — Usage five-hour windows backend

## Objetivo
Añadir un read model backend dedicado para últimas ventanas 5h de Codex dentro del bloque Usage/#51.

## Decisión de scope
17.4 queda dividida. Esta microfase cierra solo la frontera backend de ventanas 5h y deja fuera UI y actividad Hermes.

## Alcance
- `GET /api/v1/usage/five-hour-windows?limit=8`.
- `limit` validado `1..24`.
- Lectura read-only de la SQLite allowlisted `codex-usage-snapshot-sqlite` en `mode=ro`.
- Agrupación por `primary_window_start_at`/`primary_reset_at` normalizados a minuto UTC
- Salida saneada: `started_at`, `ended_at`, `peak_used_percent`, `delta_percent`, `samples_count`, `status`.
- Contrato TS compartido `UsageFiveHourWindowsResponse`.
- Tests de camino feliz y degradación `not_configured`.
- Docs vivas actualizadas.

## Fuera de alcance
- UI `/usage` para mostrar ventanas.
- Actividad Hermes local agregada.
- Lectura de `state.db` Hermes.
- Escritura, export, acciones operativas, prompts, conversaciones, tokens, raw payload o rutas runtime.

## Semántica
- `peak_used_percent`: máximo de `primary_used_percent` dentro de la ventana.
- `delta_percent`: suma de incrementos positivos dentro de la misma ventana, no resta global que pueda convertir descensos/resets en señal falsa.
- Inicio/reset se normalizan a minuto UTC para absorber jitter de segundos observado en snapshots reales.
- `status`: reutiliza semántica de ventana (`normal`, `high`, `critical`, `limit_reached`, `unknown`) basada en pico.
- Sin snapshots/fuente ausente: `not_configured` visible y content-free.

## Verify esperado
- Red inicial de tests nuevos.
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q`.
- `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py`.
- `npm --prefix apps/web run typecheck` para contratos compartidos.
- `git diff --check`.
- Smoke TestClient del endpoint real contra la SQLite allowlisted si existe.

## Review
Franky + Chopper: frontera backend/fuente operativa SQLite y no leakage.

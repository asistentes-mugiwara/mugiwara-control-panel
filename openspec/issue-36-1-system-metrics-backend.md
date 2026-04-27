# Issue #36.1 — Backend system metrics read model/API

## Estado
- **Fase:** 36.1 — Backend read model/API foundation.
- **Rama:** `zoro/issue-36-1-system-metrics-backend`.
- **Issue:** [#36 Always-visible header system metrics](https://github.com/asistentes-mugiwara/mugiwara-control-panel/issues/36).
- **Alcance:** backend/API/contracts/docs/guardrail. Sin UI, sin adapter frontend, sin polling, sin cierre de #36.

## Objetivo
Crear la primera frontera backend read-only para métricas de sistema que luego consumirá el header global:

```text
GET /api/v1/system/metrics
```

## Contrato implementado
Envelope:

```json
{
  "resource": "system.metrics",
  "status": "ready | source_unavailable",
  "data": {
    "ram": { "used_bytes": 1, "total_bytes": 2, "used_percent": 50.0, "source_state": "live" },
    "disk": { "used_bytes": 1, "total_bytes": 2, "used_percent": 50.0, "source_state": "live" },
    "uptime": { "days": 0, "hours": 1, "minutes": 2, "source_state": "live" },
    "updated_at": "2026-04-27T12:00:00Z",
    "source_state": "live | degraded"
  },
  "meta": {
    "read_only": true,
    "sanitized": true,
    "source": "os-allowlisted-system-metrics",
    "disk_target": "fastapi-visible-root-filesystem"
  }
}
```

## Decisiones
- Módulo nuevo: `apps/api/src/modules/system`.
- Endpoint fijo: `GET /api/v1/system/metrics`.
- RAM: parseo estrecho de `/proc/meminfo`; usado = `MemTotal - MemAvailable`, no `MemTotal - MemFree`.
- Disco: `shutil.disk_usage('/')`; el path real no se serializa y se documenta como `fastapi-visible-root-filesystem`.
- Uptime: parseo estrecho de `/proc/uptime`; salida solo días/horas/minutos.
- Degradación: cada familia (`ram`, `disk`, `uptime`) puede caer a `source_state: unknown` con valores `null`; el envelope pasa a `source_unavailable` y `data.source_state: degraded`.
- Errores: no se devuelven mensajes raw ni excepciones.
- Sin input cliente: querystrings tipo `path`, `mount`, `device`, `command`, `url`, `method`, `host`, `target` no controlan fuentes ni se ecoan.

## Fuera de alcance
- UI/header visible.
- Adapter frontend server-only.
- Polling, refresh automático, caché/TTL.
- Guardrail frontend/bundle.
- Cierre de issue #36.
- Issue #40.

## Seguridad y no-leakage
El endpoint no debe exponer:
- paths crudos (`/srv`, `/home`, `/proc`, disco target real);
- mount table;
- device names;
- hostname;
- process list;
- users;
- raw `/proc`;
- stdout/stderr/raw output;
- logs, tracebacks o excepciones;
- tokens, `.env`, credenciales.

El guardrail `npm run verify:system-metrics-backend-policy` fija la frontera backend:
- endpoint y router registrados;
- fuente RAM/disco/uptime allowlisted;
- no shell/subprocess/comandos host;
- tests de no-leakage y querystring cliente;
- docs vivas actualizadas.

## Review esperado
- **Franky:** semántica operativa RAM/disco/uptime, target disco, degradación y coste.
- **Chopper:** host boundary, no-leakage, ausencia de consola host y saneado de errores.

Usopp queda fuera de 36.1 porque no hay UI.

## Verify esperado
- Red inicial: `PYTHONPATH=. pytest apps/api/tests/test_system_metrics_api.py -q` falla por módulo inexistente.
- Green: `PYTHONPATH=. pytest apps/api/tests/test_system_metrics_api.py -q`.
- `python3 -m py_compile apps/api/src/modules/system/*.py apps/api/tests/test_system_metrics_api.py`.
- `PYTHONPATH=. pytest apps/api/tests/test_perimeter_api.py apps/api/tests/test_healthcheck_dashboard_api.py -q`.
- `npm run verify:system-metrics-backend-policy`.
- `npm run verify:perimeter-policy`.
- `npm run verify:healthcheck-source-policy`.
- `npm --prefix apps/web run typecheck` si se toca `packages/contracts`.
- `git diff --check`.

# Phase 17.4c — Usage Hermes activity backend

## Decisión de corte
17.4c **no se divide más** antes de implementar.

Motivo: el alcance viable y seguro queda limitado a una sola frontera backend/read-only:
- endpoint fijo `GET /api/v1/usage/hermes-activity?range=...`;
- lectura local server-side de perfiles Hermes allowlisted;
- salida agregada por perfil/rango;
- sin UI visible, sin escritura y sin productor/timer nuevo.

Sí queda separado de 17.4d porque la UI de actividad y el closeout final de #51 mezclan otra frontera visible y requieren review Usopp + Chopper.

## Objetivo
Añadir un read model backend de actividad Hermes local agregada para `/usage`, manteniendo el contrato de seguridad de #51:
- read-only;
- server-only;
- deny-by-default;
- sin raw prompts;
- sin conversaciones;
- sin tool payloads crudos;
- sin tokens por sesión/conversación;
- sin rutas de `state.db` en payloads;
- sin chat IDs, delivery targets, user IDs, secretos, headers, cookies ni logs.

## Alcance implementado
- Nuevo endpoint: `GET /api/v1/usage/hermes-activity?range=7d|30d|current_cycle|previous_cycle`.
- Config server-only: `MUGIWARA_HERMES_PROFILES_ROOT`.
- Perfiles allowlisted: tripulación Mugiwara explícita.
- SQLite profile state abierto en `mode=ro`.
- Agregados por perfil/rango:
  - sesiones;
  - mensajes;
  - tool calls;
  - primera/última actividad;
  - nivel `low|medium|high`;
  - perfil dominante por volumen agregado.
- Rango `current_cycle`/`previous_cycle` reutiliza el ciclo Codex si hay snapshot; si no, degrada de forma visible.

## Fuera de alcance
- UI de actividad Hermes en `/usage`.
- Cierre de #51.
- Proyecciones o causalidad Codex↔Hermes.
- Model/platform breakdown.
- Tokens, costes, sesiones individuales, conversaciones, prompts o tool payloads.
- Productor nuevo, timer, cronjob o copia intermedia de datos.

## TDD
Tests rojos iniciales añadidos antes de implementación:
- agregación por perfiles desde DBs sintéticas sin fuga de campos sensibles;
- degradación cuando la raíz de perfiles no está configurada;
- rechazo 422 saneado de rango no allowlisted.

## Verificación esperada
- `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py`
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q`
- `npm run verify:usage-server-only`
- `npm --prefix apps/web run typecheck`
- `git diff --check`
- smoke TestClient contra fuente real si `MUGIWARA_HERMES_PROFILES_ROOT` está configurado localmente, verificando que no aparecen paths ni marcadores sensibles.

## Review
Obligatoria:
- Franky: operabilidad, config server-only, lectura SQLite read-only y degradaciones.
- Chopper: privacidad, no leakage y frontera de datos Hermes.

Usopp no aplica en 17.4c porque no hay UI visible; entra en 17.4d.

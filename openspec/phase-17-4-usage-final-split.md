# Phase 17.4 — Usage final split for #51

## Decisión de división
17.4 **sí se divide** antes de implementar. Cerrar #51 de una vez mezclaría tres fronteras distintas:

1. read model backend de ventanas 5h históricas sobre SQLite Codex;
2. UI visible en `/usage` para esas ventanas;
3. actividad Hermes local agregada leyendo `state.db` de perfiles allowlisted.

La tercera frontera introduce una fuente distinta a la SQLite de Franky y requiere saneado específico para no exponer prompts, mensajes, rutas, IDs o datos por conversación. Meterlo en la misma PR que ventanas 5h aumentaría riesgo y dificultaría review.

## Microfases

### 17.4a — backend five-hour windows
- Añadir `GET /api/v1/usage/five-hour-windows?limit=8`.
- Fuente única: SQLite allowlisted `codex-usage-snapshot-sqlite` en `mode=ro`.
- Agrupar por `primary_window_start_at`/`primary_reset_at`.
- Serializar solo inicio, fin, pico %, delta positivo dentro de ventana, número de muestras y estado saneado.
- Fuera de alcance: UI, actividad Hermes, nueva fuente `state.db`, escritura.
- Review: Franky + Chopper.

### 17.4b — UI windows
- Extender adapter server-only y `/usage` para mostrar últimas ventanas 5h.
- Fixture fallback saneada.
- Guardrail `verify:usage-server-only` actualizado.
- Fuera de alcance: actividad Hermes.
- Review: Usopp + Chopper.

### 17.4c — backend Hermes activity aggregation
- Diseñar y añadir read model agregado/read-only sobre perfiles Hermes allowlisted.
- Exponer solo perfiles, sesiones/mensajes/tool calls agregados y rangos redondeados/saneados.
- Prohibido: prompts, contenidos, raw conversations, user IDs, chat IDs, tool payloads, rutas DB, costes detallados por conversación, tokens crudos por sesión.
- Review: Franky + Chopper.

### 17.4d — UI Hermes activity + closeout #51
- Mostrar actividad Hermes como correlación orientativa, no causalidad exacta.
- Actualizar docs, Project Summary/vault, issue #51 y closeout Engram.
- Review: Usopp + Chopper; Franky solo si cambia fuente/backend.

## Definition of Done de 17.4 completo
- #51 cumple navegación, current-state, calendario, ventanas 5h y actividad Hermes agregada saneada.
- No hay escritura ni exposición de secretos/PII/raw payloads/prompts/logs.
- Verify backend/frontend/guardrails pasado por microfase.
- Project Summary y issue #51 reflejan cierre real.

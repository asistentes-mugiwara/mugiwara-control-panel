# Phase 17.3 — Usage calendar backend read model

## Decisión de corte
Sí divido 17.3.

Motivo: el calendario por fecha natural introduce una frontera backend histórica nueva (`GET /api/v1/usage/calendar`) y una integración UI visible posterior. Mezclar backend aggregation, contrato TS, UI responsive, smoke visual y review Usopp+Chopper+Franky en una sola PR volvería a sobredimensionar la fase.

Corte aplicado:
- **17.3a** — backend calendar read model y contrato compartido.
- **17.3b** — UI calendario en `/usage` + pulidos menores de Usopp de PR #71.

## Objetivo de 17.3a
Añadir el primer read model histórico saneado de Usage: calendario por fecha natural sobre la SQLite saneada de Codex usage, sin actividad Hermes, sin nuevas fuentes y sin UI todavía.

## Alcance 17.3a
- Endpoint `GET /api/v1/usage/calendar?range=current_cycle|previous_cycle|7d|30d`.
- Agregación por fecha natural en `Europe/Madrid`.
- Deltas diarios del `ciclo semanal Codex`.
- Detección de tramo parcial cuando el día coincide con inicio/reset de ciclo.
- Conteo de ventanas 5h del día y pico diario 5h.
- Tipos TS compartidos `UsageCalendar*`.
- Docs vivas `api-modules` y `read-models`.

## Fuera de alcance
- Renderizar calendario en `/usage`.
- Actividad Hermes agregada, perfiles dominantes, mensajes, sesiones, tool calls o tokens.
- Endpoint dedicado de ventanas 5h históricas.
- Proyecciones agresivas o atribución causal por Mugiwara.
- Escritura, export o acciones operativas.

## Principios operativos
- Fuente única: SQLite allowlisted producida por Franky fuera del backend.
- Backend sigue read-only y no ejecuta shell, no lee filesystem arbitrario y no expone rutas runtime.
- `range` es allowlist estricta; inputs desconocidos caen en validación saneada.
- Usar siempre `ciclo semanal Codex`, no “semana” a secas.
- El calendario usa fecha natural para UX, pero no afirma causalidad Hermes/Codex.

## DoD 17.3a
- Tests backend cubren agrupación por fecha natural, tramo parcial por inicio de ciclo, delta diario, ventanas 5h, pico 5h y rechazo saneado de rango inválido.
- Respuesta usa `resource='usage.calendar'`, `read_only`, `sanitized`, source fija y timezone `Europe/Madrid`.
- Payload no contiene paths runtime, raw payload ni datos prohibidos.
- Contrato TS y docs vivos actualizados.

## Verify esperado
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q`.
- `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py`.
- `npm --prefix apps/web run typecheck`.
- `git diff --check`.

## Review esperada
- Franky: semántica operativa de SQLite/rangos/deltas.
- Chopper: privacidad, allowlist de `range`, no leakage y no nueva superficie genérica.
- Usopp no es obligatorio hasta 17.3b, salvo comentario opcional de producto.

## 17.3b previsto
- Integrar calendario en `/usage`.
- Mobile como cards apiladas, desktop como tabla/card grid sin scroll horizontal obligatorio.
- Aplicar followups menores de Usopp de PR #71 si encajan: copy de reset fallback, menor peso visual de metodología, fórmulas más legibles.

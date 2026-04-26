# Phase 17.3b — Usage calendar UI

## Objetivo
Integrar en `/usage` el calendario por fecha natural cerrado en 17.3a, manteniendo la página read-only, server-only y sin ampliar fuentes ni actividad Hermes.

## Por qué ahora
17.3a ya expone `GET /api/v1/usage/calendar?range=current_cycle|previous_cycle|7d|30d` y los contratos TS. El siguiente corte seguro es una UI visible que consuma solo `current_cycle` y deje ventanas históricas dedicadas/Hermes activity para 17.4.

## Alcance
- Adapter server-only `fetchUsageCalendar('current_cycle')` con rango allowlisted.
- Fixture local saneada para fallback/snapshot visual.
- Panel responsive en `/usage` con:
  - fecha natural Europe/Madrid;
  - delta diario del ciclo semanal Codex;
  - número de ventanas 5h;
  - pico diario 5h;
  - marca de tramo parcial por inicio/reset de ciclo.
- Pulido menor del copy de alcance para reflejar que calendario ya entra en 17.3b.
- Guardrail `verify:usage-server-only` actualizado para fijar adapter calendario y grid responsive.
- Baseline visual actualizado para que `/usage` espere calendario y siga excluyendo actividad Hermes/ventanas históricas dedicadas.

## Fuera de alcance
- Cambiar backend Usage o endpoint 17.3a.
- Selector interactivo de rangos (`previous_cycle`, `7d`, `30d`).
- Endpoint dedicado de ventanas 5h históricas.
- Actividad Hermes agregada, perfiles dominantes, sesiones, mensajes, tool calls o tokens.
- Escritura, export o acciones operativas.

## Principios operativos
- `ciclo semanal Codex`, nunca “semana” a secas.
- El calendario usa fecha natural para orientación humana, no para afirmar causalidad ni consumo por Mugiwara.
- La UI no lee env ni backend URL directamente; todo pasa por adapter server-only.
- Fallback/snapshot queda visible como no tiempo real.
- Sin scroll horizontal obligatorio: cards/grid responsive.

## DoD
- `/usage` renderiza calendario por fecha natural en desktop/tablet/mobile.
- No aparecen prompts, raw conversations, tokens, headers, account/user IDs, rutas runtime ni backend URL.
- `verify:usage-server-only` fija endpoint calendario y no permite proxy genérico.
- `typecheck`, `build`, `verify:visual-baseline`, `verify:usage-server-only` y `git diff --check` pasan.
- Smoke browser confirma `/usage` sin errores de consola ni overflow horizontal obvio.

## Review esperada
- Usopp: UI/UX/responsive/copy visual de calendario.
- Chopper: no leakage, server-only, no env pública ni proxy genérico.
- Franky no es obligatorio si no cambia backend/runtime/fuentes.

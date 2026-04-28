# Issue #104 — Healthcheck review clarity

## Objetivo
Aclarar por qué Healthcheck muestra `En revisión` y separar visual/semánticamente:
1. estado actual;
2. causa/motivos actuales;
3. bitácora histórica.

## Alcance
- Añadir una causa actual saneada al read model (`summary_bar.current_cause`) derivada solo de registros vivos (`modules`/records), nunca de eventos históricos.
- Marcar la bitácora como histórica (`events[].kind = historical`).
- Ajustar `/healthcheck` para mostrar `Estado actual del Healthcheck`, `Causa actual` y `Bitácora histórica` en jerarquía separada.
- Ajustar copy de badges históricos para evitar `Incidencia` a secas en eventos pasados.
- Mantener Healthcheck read-only, server-only y saneado.

## Fuera de alcance
- Nuevas fuentes Healthcheck.
- Nuevos comandos host o lectura de logs/stdout/stderr.
- Cambios grandes de arquitectura o consola host.
- Exponer rutas internas, units, manifests, tokens, prompts, secrets o datos runtime.

## Diseño
El backend ya calculaba `overall_status` desde los módulos vivos; la bitácora (`SAFE_EVENTS`) era solo payload visual. La microfase fija esa frontera en contrato:

- `summary_bar.current_cause` se calcula desde el registro vivo con mayor prioridad por `_STATUS_ORDER` cuando `overall_status != pass`.
- Si todos los módulos vivos están `pass`, `current_cause = null` aunque existan eventos históricos `warn/fail`.
- `events[].kind = historical` identifica explícitamente que la bitácora no es estado activo.
- La UI usa `current_cause` para copy tipo `En revisión por Project health` y muestra la bitácora bajo título `Bitácora histórica` con subtítulo de no-actividad.

## Semántica resultante
Antes:
- `En revisión` era la traducción visual genérica de `warn` y la causa podía inferirse mirando tarjetas/señales.
- Eventos históricos con `fail` podían parecer incidencias activas por aparecer como `Incidencia` en la bitácora.

Después:
- `En revisión` significa que una fuente actual requiere atención por estado operativo revisable, stale/freshness, severidad media, fuente parcial/no configurada o estado desconocido.
- La causa actual visible viene de `summary_bar.current_cause`/`signals`, no de eventos históricos.
- La bitácora queda explícitamente histórica y no contamina el estado actual.

## Tests / guardrails
- Tests backend para demostrar que eventos históricos `fail/warn` no elevan `overall_status`, `warnings`, `incidents` ni `current_cause`.
- `verify:healthcheck-review-clarity` fija presencia de contrato/copy de causa actual y bitácora histórica.
- Guardrails existentes Healthcheck siguen aplicando frontera read-only/no host console.

## Review esperada
- Usopp: UI/copy/claridad/accesibilidad visible.
- Chopper: contrato Healthcheck, saneado, no-leakage y separación histórico/estado actual.
- Franky: no requerido salvo que detecte riesgo operativo; no se tocan producers, timers, manifests ni runtime.

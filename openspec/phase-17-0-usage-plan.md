# Phase 17.0 — Usage page block plan

## Objetivo
Abrir el bloque Usage para GitHub #51 sin mezclarlo con Git control (#40), header metrics (#36) ni productores Healthcheck pendientes. La feature debe exponer uso Codex/Hermes en modo read-only, con contratos saneados y progreso por microfases.

## Por qué ahora
Pablo pidió comenzar Phase 17.0 y 17.1 y PR #69 ya consumió esa numeración para Usage. El issue #51 contiene UX/product input de Usopp y existe una fuente operativa saneada producida por Franky: `codex-usage-snapshot.py` escribe snapshots cada 15 minutos en una SQLite fija bajo runtime privado.

## Corrección de roadmap
Antes de PR #69 existía un plan verbal que proponía usar Phase 17.x para productores Healthcheck pendientes (`vault-sync-status` y `backup-health-status`). Esa asignación quedó contradicha por la ejecución ya mergeada de Usage. Para evitar drift:
- **Phase 17.x queda canónicamente reservada a Usage / GitHub #51**.
- **Los productores Healthcheck pendientes pasan a Phase 18.x**.
- Si se pide “continúa 17.x”, debe interpretarse como continuar Usage salvo que Pablo indique explícitamente lo contrario.

## Principios operativos
- Backend como frontera de seguridad: ruta fija allowlisted, sin filesystem arbitrario, sin shell, sin raw payload.
- Etiqueta obligatoria: `ciclo semanal Codex`, no “semana” a secas.
- La página es read-only; no añade acciones ni duplicación de `/healthcheck`.
- Actividad Hermes local queda para subfase separada y solo como agregado saneado.
- UI responsive: calendario por fecha natural, mobile sin scroll horizontal obligatorio.

## Fuera de alcance del bloque inicial
- Modificar `/uso` de Telegram.
- Escrituras, export CSV o predicción agresiva tipo “quedan X prompts”.
- Atribución exacta de consumo Codex por Mugiwara o conversación.
- Exponer prompts, raw conversations, logs, email, user/account IDs, tokens u OAuth.
- #40 Git control y #36 header metrics.

## Subfases

### 17.1 — Backend current snapshot foundation
Alcance:
- Crear módulo backend `usage`.
- Exponer `GET /api/v1/usage/current`.
- Leer solo la SQLite saneada allowlisted de Codex usage.
- Publicar plan, ventana 5h, ciclo semanal Codex, frescura y recomendación actual.
- Degradar DB ausente/ilegible a `not_configured`/`unknown` sin rutas internas.

DoD:
- Tests backend para snapshot listo, DB ausente y snapshot stale.
- Respuesta `resource_response` con `read_only`, `sanitized`, `source` y frecuencia.
- No serializa path runtime, raw payload ni identificadores prohibidos.
- Docs vivas actualizadas.

Verify esperado:
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py`
- `python3 -m py_compile apps/api/src/modules/usage/service.py apps/api/src/modules/usage/router.py apps/api/tests/test_usage_api.py`
- `git diff --check`

### 17.2 — Usage page shell and current state UI
Alcance:
- Añadir navegación `Uso` y ruta `/usage`.
- Server loader/BFF frontend server-only contra `/api/v1/usage/current`.
- Render header, cuatro cards superiores y metodología mínima.
- Estados loading/fallback/error/stale visibles.

Verify esperado:
- Typecheck/build web.
- `verify:visual-baseline`.
- Browser smoke responsive dirigido.
- Review Usopp + Chopper si se toca copy de privacidad y frontend visible.

### 17.3 — Calendar read model
Alcance:
- `GET /api/v1/usage/calendar?range=current_cycle|previous_cycle|7d|30d`.
- Agregación por fecha natural, deltas de ciclo, tramos parciales y pico 5h.
- Sin actividad Hermes por conversación; solo agregados si existe fuente saneada.

Verify esperado:
- Tests de partición por ciclo/reset y no scroll horizontal en mobile cuando llegue la UI.

### 17.4 — Five-hour windows and Hermes aggregated activity
Alcance:
- `GET /api/v1/usage/five-hour-windows?limit=8`.
- `GET /api/v1/usage/hermes-activity?range=...` solo si hay fuente agregada segura.
- Copy de correlación orientativa, sin causalidad exacta.

Verify esperado:
- Tests de límites, saneado y no leakage.
- Review Chopper + Franky.

### 17.5 — UI closeout and canon refresh
Alcance:
- Completar responsive, docs, OpenSpec closeout, Project Summary/vault y issue #51.
- PR review con Usopp + Chopper + Franky si backend/runtime sigue tocado.

## Riesgos
- La fuente SQLite es operativa real; no debe versionarse ni copiarse al repo.
- La primera UI puede sobredimensionarse si se intenta meter calendario completo y Hermes activity en la misma PR.
- La semántica `allowed`/`limit_reached` puede fluctuar en snapshots; la UI debe mostrarlos como estado de snapshot, no verdad absoluta.
- La actividad Hermes local necesita un diseño aparte para no filtrar prompts o conversaciones.

## Política de rama/cierre
- Rama: `zoro/phase-17-usage-foundation`.
- Commits semánticos con trailers Mugiwara.
- PR relevante requiere Franky/Chopper para backend/fuente runtime; Usopp cuando entre UI visible.

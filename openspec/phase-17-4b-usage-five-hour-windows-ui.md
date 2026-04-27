# Phase 17.4b — Usage five-hour windows UI

## Objetivo
Integrar en `/usage` las ventanas 5h históricas dedicadas cerradas en 17.4a, manteniendo la página server-only, read-only y sin actividad Hermes.

## Alcance
- Extender adapter server-only con `fetchUsageFiveHourWindows(8)`.
- Añadir fixture fallback saneada de ventanas 5h.
- Renderizar panel responsive `Ventanas 5h históricas` con inicio/fin, pico, delta intra-ventana, muestras, estado y barra de pico.
- Actualizar `verify:usage-server-only` para fijar endpoint de ventanas y grid/list responsive.
- Incorporar follow-up menor de Chopper de PR #74: test explícito de límites inválidos para `/five-hour-windows`.
- Actualizar docs vivas y AGENTS del módulo Usage.

## Fuera de alcance
- Backend nuevo o cambio semántico del endpoint 17.4a.
- Actividad Hermes local agregada, `state.db`, perfiles dominantes, sesiones/mensajes/tool calls o tokens.
- Selector interactivo de rangos.
- Escritura, export o acciones operativas.

## Verify esperado
- `npm run verify:usage-server-only`.
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build`.
- `npm run verify:visual-baseline`.
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q`.
- `git diff --check`.
- Browser smoke `/usage`: panel de ventanas visible, consola limpia y sin overflow horizontal.

## Review
Usopp + Chopper. Usopp revisa UX/responsive/copy; Chopper revisa que la UI no exponga paths, raw payload ni actividad Hermes y que el adapter siga server-only.

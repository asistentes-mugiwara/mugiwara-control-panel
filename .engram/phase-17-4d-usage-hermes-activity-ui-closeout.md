# Phase 17.4d closeout — Usage Hermes activity UI + #51

## Resultado
Phase 17.4d integra la actividad Hermes agregada en `/usage` y prepara el cierre final de #51.

## Cambios técnicos
- Adapter server-only `fetchUsageHermesActivity('7d')` consume `GET /api/v1/usage/hermes-activity?range=7d`.
- `/usage` carga current snapshot, calendario, ventanas 5h y actividad Hermes en paralelo, manteniendo fallback saneado.
- Añadida fixture sintética `usage-hermes-activity.fixture.ts`.
- Panel `Actividad Hermes agregada` muestra perfiles activos, sesiones, mensajes, tool calls, perfil dominante, primera/última señal y nivel bajo/medio/alto.
- Copy de actividad declara correlación orientativa; no atribuye causalidad exacta Codex por perfil.
- Metodología del ciclo semanal Codex compactada a `SurfaceCard` para reducir peso visual.
- Badge de calendario permite wrap dentro de cards para corregir micro-overflow menor.
- Guardrail `verify:usage-server-only` ampliado para fijar adapter/UI de Hermes activity y evitar regresiones de leakage.

## Frontera de seguridad
La UI no muestra root de perfiles, rutas de `state.db`, prompts, conversaciones crudas, payloads de herramientas, tokens por sesión/conversación, user IDs, chat IDs, delivery targets, secretos, headers, cookies, logs ni valores de configuración runtime. Solo serializa y renderiza agregados saneados ya entregados por backend.

## Decisión de división
17.4d no se dividió más: no toca backend, fuente, runtime, productores, cache ni polling. El alcance homogéneo era UI server-only + fallback + docs/canon.

## Verify
- Red inicial: `npm run verify:usage-server-only` falló antes de implementar el adapter/UI de Hermes activity.
- `npm run verify:usage-server-only` → passed.
- `npm --prefix apps/web run typecheck` → passed.
- `npm --prefix apps/web run build` → `/usage` dinámica (`ƒ`).
- `npm run verify:visual-baseline` → checklist actualizado/passed.
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` → 12 passed.
- `git diff --check` → passed.
- Browser smoke `/usage` contra API local de la rama: panel visible, consola limpia, sin backend URL/root Hermes/rutas de DB en DOM y sin overflow horizontal en viewport inspeccionado.

## Review requerido
Usopp + Chopper obligatorios. Franky no se requiere salvo que aparezcan cambios backend/runtime/fuente/polling/cache.

# Phase 17.4d verify checklist

## Red / TDD
- [x] Guardrail `verify:usage-server-only` falló antes de implementar UI porque faltaban endpoint `hermes-activity` en adapter, tipo `UsageHermesActivityResponse`, panel `Actividad Hermes agregada` y no-leakage UI.

## Frontend contract
- [x] Adapter server-only llama endpoint fijo `/api/v1/usage/hermes-activity?range=7d`.
- [x] Página `/usage` sigue como server page dinámica y no lee env directa.
- [x] Fixture fallback de actividad Hermes es sintética y saneada.
- [x] Panel de actividad muestra solo agregados por perfil/rango.
- [x] Copy declara correlación orientativa y no causalidad exacta.
- [x] UI no renderiza perfiles root, rutas de DB, `state.db`, prompts crudos, conversaciones, payloads de herramientas, tokens por sesión/conversación, user IDs, chat IDs, delivery targets, secretos, headers/cookies ni logs.
- [x] Metodología compactada y badge del calendario permite wrap para evitar micro-overflow.

## Verify ejecutado
- [x] `npm run verify:usage-server-only`
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] `npm run verify:visual-baseline`
- [x] `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q`
- [x] `git diff --check`
- [x] Browser smoke `/usage`: panel visible, consola limpia, sin backend URL/root Hermes/rutas de DB renderizadas y sin overflow horizontal obligatorio en viewport inspeccionado.

## Review
- [x] PR creada: #77.
- [x] Handoff comentado en PR: https://github.com/asistentes-mugiwara/mugiwara-control-panel/pull/77#issuecomment-4324730123
- [x] Usopp invocado y review recibido: `approve`, comentario manual en PR por bloqueo de aprobación formal con cuenta compartida.
- [x] Chopper invocado y review recibido: `approve`, comentario manual en PR por bloqueo de aprobación formal con cuenta compartida.
- [ ] #51 comentado/cerrado solo tras merge y canon final.

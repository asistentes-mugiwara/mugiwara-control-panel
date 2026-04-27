# Phase 17.4d — Usage Hermes activity UI + #51 closeout

## Decisión de corte
17.4d **no se divide más** antes de implementar.

Motivo: tras PR #76 la frontera sensible backend ya está cerrada. Esta microfase queda acotada a UI server-only/read-only, fixture fallback saneada, guardrail, documentación/canon y cierre de #51. No añade endpoints, productores, polling, cache/TTL, escritura, nuevas fuentes ni cambios runtime.

## Alcance
- Extender el adapter server-only de Usage con `fetchUsageHermesActivity('7d')`.
- Integrar `/usage` con `GET /api/v1/usage/hermes-activity?range=7d`.
- Añadir fixture fallback saneada para actividad Hermes agregada.
- Renderizar panel `Actividad Hermes agregada` sin tabla ni scroll horizontal obligatorio.
- Mostrar únicamente agregados por perfil/rango: perfiles activos, sesiones, mensajes, tool calls, perfil dominante, primera/última señal y nivel bajo/medio/alto.
- Explicar la relación Hermes/Codex como **correlación orientativa**, no causalidad exacta por perfil.
- Compactar la metodología de ciclo semanal Codex para que `/usage` no crezca con avisos pesados.
- Corregir de forma segura el micro-overflow menor en labels del calendario permitiendo wrap del badge dentro de cards Usage.
- Actualizar docs vivas, closeout Engram y Project Summary del vault.
- Comentar/cerrar #51 solo cuando PR, reviews y verify confirmen cierre real.

## Fuera de alcance
- Phase 18.x Healthcheck producers.
- Cambios backend o fuente Hermes.
- Polling frecuente, cache/TTL o métricas nuevas.
- Exponer `MUGIWARA_HERMES_PROFILES_ROOT`, rutas de perfiles, rutas de `state.db` o detalles de DB.
- Raw prompts, conversaciones, tool payloads, logs, headers, cookies, user IDs, chat IDs, delivery targets, secretos, costes o tokens por sesión/conversación.
- Atribución causal exacta de consumo Codex por Mugiwara.
- Selector de rangos o gráficas complejas.

## Diseño seguro
- La página sigue siendo server page dinámica (`force-dynamic`) y el adapter conserva `import 'server-only'`.
- El frontend solo llama endpoints fijos desde `MUGIWARA_CONTROL_PANEL_API_URL` server-only.
- La UI no lee env directamente ni renderiza valores de configuración.
- El fallback local contiene datos sintéticos saneados y no rutas/IDs reales.
- Los textos de privacidad hablan en categorías de exclusión, no en valores runtime.

## Review routing
- Usopp obligatorio: UI/UX/responsive/copy.
- Chopper obligatorio: no-leakage y frontera de datos Hermes en UI.
- Franky no aplica salvo que aparezca cambio backend/runtime/fuente/polling/cache; en esta microfase no aparece.

## Definition of Done
- `/usage` muestra actividad Hermes agregada con copy de correlación orientativa.
- No hay scroll horizontal obligatorio en desktop/mobile.
- Guardrail `verify:usage-server-only` fija endpoint, adapter typed, panel UI y no rendering de internals Hermes.
- `typecheck`, `build`, `verify:visual-baseline`, backend usage tests y `git diff --check` pasan.
- Docs/OpenSpec/Engram/Project Summary actualizados.
- PR abierta y revisada por Usopp + Chopper antes de merge/cierre #51.

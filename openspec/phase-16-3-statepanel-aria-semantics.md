# Phase 16.3 — StatePanel ARIA semantics (#48)

## Objetivo
Cerrar #48 como una microfase de accesibilidad frontend: `StatePanel` deja de anunciar todos los estados como `role="status"` y permite semántica ARIA explícita solo cuando el caso lo justifica.

## Decisión de corte
Se comprobó el alcance real y **no conviene dividirlo en fases más pequeñas**.

Razones:
- La superficie principal es un único componente compartido: `apps/web/src/shared/ui/state/StatePanel.tsx`.
- Los usos existentes son homogéneos: paneles vacíos, fallback, snapshot, explicativos y avisos de prioridad.
- No hay backend, runtime, API, dependencias ni cambios visuales.
- Dividirlo generaría dos PRs artificiales: una para el prop y otra para usos/docs/guardrail, con más coordinación que valor.

Sí se mantiene como microfase independiente de #47/#46 para no mezclar accesibilidad semántica con polish visual o UX específica de Skills.

## Alcance
- Auditar usos de `StatePanel` en Dashboard, Healthcheck, Mugiwaras, Skills, Memory y Vault.
- Cambiar el default del componente a semántica quieta: sin role/live region por defecto.
- Añadir override tipado `ariaRole` para `status`, `alert`, `region` o `group`.
- Añadir `ariaLabel` para regiones/grupos nombrados cuando haga falta.
- Hacer explícita la semántica del bloque de prioridad de Healthcheck: `alert` si es incidencia, `region` si es aviso no urgente.
- Añadir guardrail estático `verify:statepanel-aria`.
- Actualizar docs frontend vivas.

## Fuera de alcance
- Rediseño visual.
- Cambios de color/contraste.
- Keyboard/focus behavior.
- Backend/API/read-models.
- Copy amplio o cambios de producto en #47/#46.

## Diseño
- `StatePanel` separa tono visual (`status`) de semántica accesible (`ariaRole`).
- Default quieto evita ruido para screen readers en estados estáticos.
- `role="status"` queda reservado a actualizaciones dinámicas polite.
- `role="alert"` queda reservado a incidencias/action-required que deban anunciarse assertivamente.
- `region`/`group` quedan disponibles para agrupación nombrada sin live-region noise.

## Definition of Done
- [x] `StatePanel` ya no hardcodea `role="status"`.
- [x] Static empty/fallback panels quedan quietos por defecto.
- [x] Urgent/action-required Healthcheck panel opta explícitamente a `alert` cuando hay incidencia.
- [x] El cambio no altera layout/copy visual salvo atributos ARIA.
- [x] Docs de frontend reflejan el contrato.
- [x] Verify web + visual baseline ejecutados.

## Review esperado
- Usopp: accesibilidad básica, intención UX y ausencia de regresión visual.
- Chopper/Franky: no requeridos; no hay seguridad, runtime, API, dependencias ni operación.

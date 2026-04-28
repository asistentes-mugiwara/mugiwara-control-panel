# Issue 112 — `/usage` polish tras PR #111

## Objetivo
Pulir `/usage` sin reabrir fronteras de datos ni tocar backend:
- compactar cifras largas de tokens manteniendo el valor completo accesible;
- mejorar affordance de scroll interno en listas largas;
- afinar accesibilidad del selector diario de ventanas 5h con IDs estables, `aria-labelledby` y `focus-visible`;
- revisar responsive/móvil si el entorno lo permite.

## Alcance
UI/accesibilidad only en frontend:
- `apps/web/src/app/usage/page.tsx`.
- `apps/web/src/modules/usage/UsageWindowDaysSelector.tsx`.
- `apps/web/src/app/globals.css`.
- guardrail estático `scripts/check-usage-server-only.mjs` para fijar la frontera y los nuevos invariantes UI.

## Fuera de alcance
- Backend, payloads, endpoints, contratos de datos, privacidad y tokens raw.
- Nuevas métricas o semántica de consumo.
- Cambios de runtime, cache, polling o configuración.
- Cambios en fuentes Hermes/Codex.

## Diseño ligero
- Mantener números de tokens como agregados existentes; solo cambiar presentación visual.
- Usar formato compacto visual con `Intl.NumberFormat(..., { notation: 'compact' })` y preservar valor completo vía `data[value]`, `title` y `aria-label`.
- Reforzar scroll interno con scrollbar visible, sombra/fade interno y microcopy discreta no anunciada por lector.
- Mantener selector como tabs: IDs estables `usage-window-day-tab-<date>` y `usage-window-day-panel-<date>`, tabpanel etiquetado por el tab seleccionado y foco visible explícito.
- Añadir navegación de teclado real al tablist (`ArrowLeft/Right`, `ArrowUp/Down`, `Home`, `End`) manteniendo foco en el tab activo.
- Ordenar las ventanas 5h del día seleccionado de más reciente a más antigua para que la lectura operativa empiece por la hora actual/más cercana.
- Estirar las cards superiores de `/usage` para que tengan la misma altura visual por abajo.

## Definition of Done
- `/usage` sigue siendo página server-side dinámica y read-only.
- No aparecen `NEXT_PUBLIC_*`, backend URL, rutas Hermes, prompts, conversaciones, tokens por sesión/conversación ni payloads crudos.
- Typecheck y build web pasan.
- `verify:usage-server-only` fija los invariantes nuevos.
- `verify:visual-baseline` pasa.
- Smoke browser de `/usage` si hay entorno local disponible.
- PR abierta en rama `zoro/issue-112-usage-polish` y review Usopp solicitada; Chopper no aplica si no cambia frontera de datos.

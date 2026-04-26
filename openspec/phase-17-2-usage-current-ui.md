# Phase 17.2 — Usage current-state UI

## Decisión de corte
No divido 17.2 en subfases adicionales.

Motivo: tras inspeccionar el estado real, 17.2 es homogénea y pequeña si se mantiene estrictamente como **UI current-state**:
- navegación `Uso`;
- ruta `/usage`;
- adapter server-only a `GET /api/v1/usage/current`;
- header, cuatro cards superiores, callout de metodología y estados degradados visibles.

Sí quedan fuera, y ya están separadas en 17.3/17.4:
- calendario por fecha natural;
- endpoints nuevos de calendar/five-hour-windows/hermes-activity;
- actividad Hermes agregada;
- proyecciones o analítica avanzada.

Si durante implementación aparece necesidad de crear nuevos endpoints backend o leer nuevas fuentes, se corta la fase y pasa a 17.3+.

## Objetivo
Materializar la primera página visible `/usage` usando solo el read model ya cerrado en 17.1, sin ampliar la superficie backend ni mezclar calendarios o actividad Hermes.

## Alcance
- Añadir navegación principal `Uso`.
- Añadir ruta server-side `/usage`.
- Crear módulo frontend `usage` con adapter server-only.
- Usar `MUGIWARA_CONTROL_PANEL_API_URL` privada, no `NEXT_PUBLIC_*`.
- Renderizar:
  - título `Uso Codex/Hermes`;
  - subtítulo `Cuota Codex, ciclos de reset y actividad local saneada.`;
  - pills: plan, última actualización, fuente snapshot cada 15 min, solo lectura;
  - cuatro cards: Ventana 5h, Ciclo semanal Codex, Plan, Recomendación actual;
  - callout de que Codex no usa semanas lunes-domingo;
  - metodología mínima de fórmulas `primary_reset_at - 18000s` y `secondary_reset_at - 604800s`;
  - estado de fuente/fallback/stale/not_configured visible.

## Fuera de alcance
- `GET /api/v1/usage/calendar`.
- `GET /api/v1/usage/five-hour-windows`.
- `GET /api/v1/usage/hermes-activity`.
- Actividad Hermes local, tokens, sesiones, mensajes o tool calls.
- Modificar `/uso` de Telegram.
- Acciones de escritura o export.

## DoD
- `/usage` compila y aparece en navegación.
- La página no usa browser-side backend URL ni `NEXT_PUBLIC_*`.
- La UI nunca llama “semana” a secas al ciclo; usa `ciclo semanal Codex`.
- Stale/not_configured/error se muestran como estado degradado, no como sano.
- En mobile las cards pasan a una columna mediante utilidades responsive existentes.
- Docs/Engram quedan actualizados.

## Verify esperado
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build`.
- `npm run verify:visual-baseline`.
- `git diff --check`.
- Smoke HTML o browser dirigido para comprobar `/usage`, navegación `Uso` y ausencia de `NEXT_PUBLIC`/backend URL en el render.

## Review esperada
- Usopp: UI/UX/responsive/copy visible.
- Chopper: copy de privacidad/no leakage y server-only boundary.
- Franky: opcional si no cambia fuente/runtime; pedirlo si detectamos riesgo operativo nuevo.

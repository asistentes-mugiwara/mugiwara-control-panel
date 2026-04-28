# Issue 112 closeout — `/usage` polish

## Resumen
Microfase UI/accesibilidad derivada de follow-ups Usopp de PR #111. El cambio pule `/usage` sin modificar backend, endpoints, payloads, contratos ni privacidad.

## Cambios previstos/cerrados
- Números largos de tokens Hermes mostrados con formato compacto visual y valor completo conservado en `data[value]`, `title` y `aria-label`.
- Listas internas de ventanas/perfiles con affordance de scroll mediante scrollbar coloreada, sombra interna y microcopy discreta.
- Selector diario de ventanas 5h con IDs estables por fecha, tabpanel enlazado con `aria-labelledby` y `focus-visible` explícito.
- Guardrail `verify:usage-server-only` ampliado para fijar estos invariantes sin tocar frontera de datos.

## Frontera preservada
UI-only. No se tocan backend, payloads, endpoints, privacy model ni tokens raw. Los tokens siguen siendo agregados ya existentes.

## Verify
Completado antes de PR:
- `npm run verify:usage-server-only`.
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build`.
- `npm run verify:visual-baseline`.
- `git diff --check`.
- Smoke HTTP/browser en producción local con API de la rama: `/usage` 200, consola limpia, sin overflow horizontal en viewport disponible, sin `MUGIWARA_CONTROL_PANEL_API_URL`, `127.0.0.1:8012`, `state.db` ni `Traceback` en HTML/DOM.

## Limitación
La herramienta de navegador disponible no permitió redimensionado real a 390×844/1024×768; se cubrió responsive mediante CSS existente, baseline versionada y viewport real 1280px.

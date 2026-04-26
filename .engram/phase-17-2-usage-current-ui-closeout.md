# Phase 17.2 — Usage current-state UI closeout

## Decisión de corte
17.2 se mantiene como microfase única, sin subfases adicionales, porque el scope real es homogéneo: navegación `Uso`, ruta server-side `/usage`, adapter server-only al endpoint ya existente `GET /api/v1/usage/current`, UI current-state y guardrail estático.

## Cerrado
- Añadida ruta `/usage` como server page dinámica.
- Añadida navegación `Uso`.
- Añadido módulo frontend `apps/web/src/modules/usage` con adapter server-only usando `MUGIWARA_CONTROL_PANEL_API_URL` privada.
- Añadido read model TS compartido para `UsageCurrentResponse` alineado con el backend 17.1.
- Añadido guardrail `npm run verify:usage-server-only`.
- Actualizadas docs frontend y baseline visual para incluir `/usage`.

## Fuera de alcance preservado
- Calendario por fecha natural: 17.3.
- Ventanas 5h históricas y endpoints adicionales: 17.3/17.4 según corte final.
- Actividad Hermes agregada: 17.4.
- Proyecciones/analítica avanzada y cualquier escritura: fuera de 17.2.

## Verify ejecutado
- `npm run verify:usage-server-only`.
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build`.
- `npm run verify:visual-baseline`.
- `git diff --check`.
- Smoke HTML dirigido de `http://127.0.0.1:3000/usage` comprobando título, navegación, wording `ciclo semanal Codex`, ausencia de env/URL backend pública y ausencia de secciones futuras de calendario/perfil dominante.
- Browser smoke desktop de `/usage` con consola limpia y revisión visual sin overflow/layout roto evidente.

## Review esperada
PR visible frontend + server-only boundary: Usopp para UI/UX/copy/responsive y Chopper para privacidad/no leakage/server-only. Franky no es obligatorio salvo que aparezca objeción sobre semántica operativa del snapshot, porque 17.2 no cambia backend, productor, timer ni fuente SQLite.

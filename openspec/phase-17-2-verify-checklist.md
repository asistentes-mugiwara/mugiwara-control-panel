# Phase 17.2 verify checklist

## Scope decision
- [x] 17.2 no se divide más: microfase única UI current-state.
- [x] Calendario, ventanas históricas y Hermes activity quedan fuera en 17.3/17.4.
- [x] No se crean endpoints backend nuevos.

## Implementation checklist
- [x] Navegación incluye `Uso` → `/usage`.
- [x] `/usage` usa server-only adapter contra `GET /api/v1/usage/current`.
- [x] No hay `NEXT_PUBLIC_*` ni backend URL browser-side.
- [x] Header muestra título, subtítulo, plan, última actualización, fuente y solo lectura.
- [x] Cards muestran ventana 5h, ciclo semanal Codex, plan y recomendación.
- [x] Copy explica que Codex no cuenta semanas lunes-domingo.
- [x] Estados `stale`, `not_configured` y error degradan visibles sin detalles internos.

## Verify evidence
- [x] `npm run verify:usage-server-only`.
- [x] `npm --prefix apps/web run typecheck`.
- [x] `npm --prefix apps/web run build`.
- [x] `npm run verify:visual-baseline`.
- [x] `git diff --check`.
- [x] Smoke dirigido `/usage`: HTML smoke + browser smoke desktop con consola limpia.

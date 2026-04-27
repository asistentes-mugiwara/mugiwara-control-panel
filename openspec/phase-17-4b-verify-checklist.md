# Phase 17.4b verify checklist

## Scope decision
- [x] 17.4b se limita a UI de ventanas 5h históricas.
- [x] No añade actividad Hermes ni nueva fuente.
- [x] Follow-up menor de Chopper de PR #74 queda cubierto con test de límites inválidos.

## UI contract
- [x] Adapter server-only consume endpoint fijo `/api/v1/usage/five-hour-windows?limit=`.
- [x] Fixture fallback saneada añadida.
- [x] `/usage` renderiza panel `Ventanas 5h históricas`.
- [x] Panel muestra inicio/fin, pico, delta intra-ventana, muestras, estado y barra.
- [x] No muestra actividad Hermes, prompts, conversaciones, tokens, raw payload ni paths runtime.
- [x] Guardrail `verify:usage-server-only` actualizado.

## Verify evidence
- [x] `npm run verify:usage-server-only`.
- [x] `npm --prefix apps/web run typecheck`.
- [x] `npm --prefix apps/web run build` → `/usage` dinámica (`ƒ`).
- [x] `npm run verify:visual-baseline`.
- [x] `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` → 9 passed.
- [x] `git diff --check`.
- [x] Browser smoke `/usage` contra API local de la rama: panel de ventanas visible, consola limpia y `document.body.scrollWidth <= window.innerWidth`.

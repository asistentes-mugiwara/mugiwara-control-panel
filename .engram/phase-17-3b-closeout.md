# Phase 17.3b closeout — Usage calendar UI

## Resultado
- `/usage` integra calendario por fecha natural usando `fetchUsageCalendar('current_cycle')` desde adapter server-only.
- La UI renderiza cards responsive con fecha Europe/Madrid, delta diario del ciclo semanal Codex, ventanas 5h, pico diario y tramo parcial por inicio/reset.
- Fallback local saneado añade fixture calendario y mantiene aviso no-tiempo-real.
- 17.4 queda como siguiente bloque para actividad Hermes agregada y ventanas históricas dedicadas.

## Verify
- Red TDD: `npm run verify:usage-server-only` falló inicialmente por adapter/UI calendario inexistentes.
- `npm run verify:usage-server-only` ✅
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅ (`/usage` sigue dinámica `ƒ`)
- `npm run verify:visual-baseline` ✅
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` ✅
- `git diff --check` ✅
- Browser smoke local `/usage` en `127.0.0.1:3200`: 3 cards calendario, consola limpia, sin overflow horizontal desktop.

## Riesgos / follow-ups
- No hay selector de rango todavía; 17.3b consume `current_cycle` para mantener alcance pequeño.
- El smoke visual real fue desktop disponible; Usopp debe revisar responsive/copy antes de merge.
- Chopper debe revisar que el adapter sigue sin env pública, proxy genérico ni leakage.

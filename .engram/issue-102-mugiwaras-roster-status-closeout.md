# Issue #102 closeout — Mugiwaras roster status

## Resultado
`/mugiwaras` deja de mostrar Usopp/Brook como `En revisión` y Jinbe/Sanji como `Sin datos`. La semántica queda fijada: el status principal representa estado operativo/canónico del Mugiwara en el roster, no disponibilidad de skills/memory ni standby parcial.

## Root cause
Los estados venían de allowlists estáticas antiguas:
- `apps/api/src/modules/mugiwaras/service.py` (`CREW_CARDS`)
- `apps/web/src/modules/mugiwaras/view-models/mugiwara-card.fixture.ts`

No era un dato derivado de healthcheck, runtime ni memoria.

## Cambios
- Backend y fixture frontend alineados con los 10 Mugiwara activos del canon.
- Brook conserva el matiz de Postgres MCP en standby en la descripción, sin degradar status.
- Jinbe/Sanji actualizados como perfiles activos con copy/roles visibles más cercanos al AGENTS canónico.
- Guardrail `verify:mugiwaras-server-only` ampliado para bloquear regresiones de status/fixture/links y roles obsoletos.
- Docs `api-modules` y `read-models` documentan la semántica.

## Verify
- `PYTHONPATH=. pytest apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py -q` ✅
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `npm run verify:mugiwaras-server-only` ✅
- `git diff --check` ✅
- Browser smoke local `/mugiwaras` contra API/Next locales: consola limpia, sin `En revisión`, sin `Sin datos`, sin overflow horizontal ✅

## Riesgo residual
Bajo. La fuente sigue siendo allowlist estática backend-owned y fallback frontend saneado; no se abre nueva lectura host ni nueva escritura.

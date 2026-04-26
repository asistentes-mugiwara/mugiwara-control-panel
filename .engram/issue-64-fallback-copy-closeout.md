# Issue 64 closeout — Fallback snapshot copy refinement

## Resultado
Cerrado el refinamiento de copy de fallback/snapshot para reducir ambigüedad de telemetría en vivo en páginas API-backed.

## Cambios
- `StatusBadge` acepta `label` opcional para mantener estado/color semántico mientras el texto visible puede decir `Operativo en último corte` en snapshot.
- Dashboard: `Lectura operativa` pasa a `Lectura de snapshot` y `lectura activa` a `snapshot disponible` solo en fallback.
- Healthcheck: `Actualizado`, `Última señal`, `Eventos recientes` y badges verdes se contextualizan como snapshot cuando hay fallback.
- Vault, Memory y Mugiwaras: fechas y badges verdes se contextualizan como snapshot/corte solo cuando la fuente no está en modo API real.

## Verify
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `npm run verify:visual-baseline` ✅ revisado
- `git diff --check` ✅

## Riesgos / follow-ups
- No se hizo inspección visual manual con navegador por viewport; el script de baseline se revisó como checklist canónico.
- No hay cambio backend ni contratos; si Usopp quiere un ajuste de wording fino, queda como follow-up visual menor.
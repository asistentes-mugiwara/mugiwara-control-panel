# Issue 64 — Fallback snapshot copy refinement

## Objetivo
Refinar labels secundarios en páginas API-backed cuando caen a fallback/snapshot local para que no parezcan telemetría en vivo en un escaneo rápido.

## Alcance
- Frontend/UI/copy únicamente.
- Mantener la lectura natural en modo API real.
- No tocar backend, contratos, runtime config, adapters ni read-models.

## Decisión de implementación
- Usar el estado de fuente ya existente (`apiNotice`, `apiState`, `viewModel.state`) como señal de `snapshot/fallback`.
- En modo snapshot, cambiar labels secundarios a términos explícitos como `Lectura de snapshot`, `Corte del snapshot`, `Eventos del snapshot`, `Última señal del snapshot` y `Operativo en último corte`.
- En modo API real, conservar lenguaje operativo normal (`Lectura operativa`, `Última actualización`, `Eventos recientes`, `Operativo`).
- Permitir override de texto en `StatusBadge` mediante prop opcional `label` sin cambiar el estado semántico/color.

## Superficies afectadas
- `/dashboard`
- `/healthcheck`
- `/vault`
- `/memory`
- `/mugiwaras`
- `StatusBadge` compartido

## Definition of Done
- [x] Los labels secundarios bajo fallback/snapshot no implican tiempo real.
- [x] El modo API real conserva copy natural.
- [x] No se exponen detalles host/backend.
- [x] `npm --prefix apps/web run typecheck` pasa.
- [x] `npm --prefix apps/web run build` pasa.
- [x] `npm run verify:visual-baseline` revisado.
- [x] `git diff --check` pasa.

## Fuera de alcance
- Cambios backend/API/read-model.
- Nuevos adapters de fuente.
- Cambios de runtime config.
- Rediseño visual o baseline de screenshots.
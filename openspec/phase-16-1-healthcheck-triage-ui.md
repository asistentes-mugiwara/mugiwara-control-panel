# Phase 16.1 — Healthcheck triage UI polish (#44)

## Objetivo
Cerrar el follow-up UX/UI de la issue #44 haciendo que `/healthcheck` funcione como superficie de respuesta priorizada, no como grid plano de checks.

## Por qué ahora
Phase 15 cerró el bloque de fuentes reales Healthcheck y dejó estable la semántica de módulos/señales. El siguiente paso seguro es pulir la jerarquía visual sin tocar backend, adapters ni nuevas lecturas host.

## Alcance
- Ordenar módulos y señales por prioridad visual usando `status` + `severity`.
- Mostrar un bloque explícito de `Acción requerida` cuando exista un módulo degradado.
- Evitar badges duplicados cuando `status` y `severity` mapean al mismo significado visual.
- Rebajar el peso visual de checks sanos `pass/low`.
- Actualizar documentación viva y baseline visual.

## Fuera de alcance
- Nuevas fuentes Healthcheck.
- Cambios backend/API/read-model.
- Controles operativos o acciones de remediación.
- Cambios de seguridad/perímetro.

## Diseño
La UI conserva los contratos existentes y añade lógica de view-model frontend:
- `getHealthcheckTriageRank(status, severity)` prioriza `critical/high/fail` sobre `stale/warn` y estos sobre `pass/low`.
- `shouldRenderSeparateSeverityBadge(status, severity)` evita duplicar visualmente badges equivalentes.
- La página ordena copias defensivas de `modules` y `signals`; no muta datos recibidos.
- El primer módulo ordenado alimenta el bloque `Acción requerida` si existe degradación.

## Definition of Done
- [x] Un `fail` o `high/critical` aparece antes que checks sanos.
- [x] Las tarjetas dejan de mostrar badges duplicados de mismo significado.
- [x] La prioridad actual es visible arriba del grid en menos de 3 segundos.
- [x] Checks sanos siguen legibles con menor peso visual.
- [x] Sin cambios backend/API ni nuevas lecturas host.
- [x] Typecheck, build y visual baseline ejecutados.

## Riesgos
- El ranking es intencionalmente frontend-only; si el backend cambia el vocabulario de estados, TypeScript debe fallar antes de producción.
- La baseline visual sigue siendo manual; no hay snapshot visual automatizado todavía.

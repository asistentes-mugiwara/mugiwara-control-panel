# Phase 9.5 closeout — memory selector + source tabs

## Resultado
- `/memory` deja de ser un mosaico simple y pasa a una vista operativa con selector de Mugiwara.
- Se añadieron tabs `Built-in` / `Honcho` con cambio local de fuente.
- La página ahora muestra:
  - selector de los 10 Mugiwara con crest y resumen corto
  - panel de estado de fuente con disponibilidad, timestamp y badge de estado
  - panel de contenido resumido por fuente
  - callout explícito de `Solo lectura`
- Se creó `apps/web/src/modules/memory/view-models/memory-agent-detail.fixture.ts` para modelar snapshots `built_in` y `honcho` por Mugiwara.
- Se amplió `memory-agent-summary.fixture.ts` para cubrir los 10 perfiles canónicos.

## Verify ejecutado
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `git diff --check` ✅

## Riesgos abiertos
- la fase sigue apoyándose en fixtures; todavía no hay backend real de memory.
- algunos estados (`unavailable`, `error`, `stale`) están modelados como demos controladas para validar UI y copy.
- aún no existe componente compartido específico para tabs/selector; la lógica sigue embebida en `page.tsx`.

## Siguiente paso recomendado
- 9.6 — Vault con layout índice/documento/metadatos y framing editorial claro frente a `memory`.

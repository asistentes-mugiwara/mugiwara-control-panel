# Phase 8.4 — memory + vault read-only core pages

## Objetivo
Convertir `memory` y `vault` desde placeholders finos a superficies read-only más realistas, todavía sin backend real.

## Alcance
- fixture tipada para `memory.agent_summary[]`
- fixture tipada para `vault.index`
- `/memory` con resúmenes por Mugiwara, facts/badges y última actualización
- `/vault` con índice allowlisted, breadcrumbs y frescura visibles
- solo mappers/utilidades mínimas si hicieran falta

## Fuera de alcance
- `memory/[slug]`
- `vault/[...path]`
- backend real o fetch
- mezcla entre `memory` y `vault`
- expansión a otros módulos

## Diseño mínimo
- `memory` usa fixture modular tipada y mantiene la página delgada, limitada a composición visual read-only.
- `vault` usa fixture modular tipada para el índice y representa navegación allowlisted dentro de la misma página mediante breadcrumbs y anchors locales.
- ambas vistas reutilizan `PageHeader`, `SurfaceCard` y `StatusBadge` del shell ya existente.

## Artefactos esperados
- `apps/web/src/modules/memory/view-models/memory-agent-summary.fixture.ts`
- `apps/web/src/modules/vault/view-models/vault-index.fixture.ts`
- `apps/web/src/app/memory/page.tsx`
- `apps/web/src/app/vault/page.tsx`
- `openspec/phase-8-4-verify-checklist.md`

## Verificación
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- comprobación manual de `/memory` y `/vault` dentro del shell

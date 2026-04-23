# Phase 11.3 — responsive fine-tuning

## Scope
Cerrar el bloque fino de responsive del MVP actual: mejorar wraps de header/topbar/cards, evitar micro-overflows en grids densas y hacer que las vistas principales degraden con más dignidad en tablet y móvil.

## Decisions
- Se introduce una capa pequeña de utilidades responsive en `globals.css` para no duplicar media queries inline por pantalla.
- `PageHeader`, `SurfaceCard` y `StatusBadge` pasan a soportar mejor títulos largos, actions apilables y badges/chips sin nowrap agresivo.
- Los layouts de `dashboard`, `mugiwaras`, `memory`, `skills`, `vault` y `healthcheck` adoptan grids reutilizables con `minmax(min(100%, ...), 1fr)` o colapso explícito de paneles.
- `vault` deja de mantener tres columnas en anchos intermedios y baja la tercera ficha a fila completa antes de móvil.
- Bloques con `code/pre` y fingerprints largos se endurecen con wrapping/scroll controlado para no romper el contenedor.
- El alcance sigue siendo de hardening visual: no se abren nuevas features ni cambios de producto.

## Definition of done
- headers, topbar y cards densas envuelven bien en anchos estrechos.
- layouts laterales de `memory`, `skills`, `healthcheck` y `vault` se apilan con dignidad cuando falta ancho.
- badges, pills, IDs y paths largos no generan overflows obvios en el MVP actual.
- la solución queda centralizada en utilidades compartidas, no en fixes aislados pantalla a pantalla.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

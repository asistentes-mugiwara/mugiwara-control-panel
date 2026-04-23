# Phase 9.6 — vault editorial workspace

## Scope
Convertir `/vault` en una superficie documental y editorial con árbol allowlisted, documento activo legible y panel de metadatos, reforzando su separación frente a `memory`.

## Decisions
- `vault` se modela como workspace documental con tres zonas: índice, documento y metadatos.
- La página usa breadcrumbs solo en el documento activo, donde sí aportan orientación real.
- El framing de `canon curado` aparece como callout editorial visible, sin repetirse como ruido en cada sección.
- El contenido se mantiene fixture-driven y allowlisted, priorizando estructura y lectura antes de backend real.
- `vault` debe sentirse navegable y curado, no operacional por fuente como `memory`.

## Definition of done
- `/vault` expone layout índice / documento / metadatos.
- existe árbol allowlisted navegable dentro de la página.
- existe documento legible con headings claros.
- existen breadcrumbs y panel de metadatos con TOC.
- se muestra framing editorial de `canon curado`.
- la separación visual respecto a `memory` es explícita.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

# Phase 9.5 — memory selector + source tabs

## Scope
Evolucionar `/memory` desde un listado read-only simple a una vista operativa con selector de Mugiwara, tabs de fuente y paneles separados de estado y contenido.

## Decisions
- `memory` sigue siendo una superficie estrictamente read-only.
- La navegación principal de 9.5 se resuelve en la propia página mediante selector de Mugiwara y tabs `Built-in` / `Honcho`.
- Se reutiliza identidad Mugiwara con `MugiwaraCrest` y el mapping canónico de 10 perfiles.
- El estado de fuente se hace explícito mediante `initialized`, `unavailable`, `stale` y `error`.
- La fuente `Built-in` y `Honcho` se modelan con fixtures separadas por Mugiwara para permitir UI coherente antes de backend real.

## Definition of done
- `/memory` expone selector de Mugiwara.
- `/memory` expone tabs `Built-in` / `Honcho`.
- existe panel de estado de fuente con timestamp y disponibilidad.
- existe panel de contenido resumido legible.
- la vista deja claro que `memory` es read-only y distinta de `vault`.
- se reutiliza `MugiwaraCrest` en la experiencia.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

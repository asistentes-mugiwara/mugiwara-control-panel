# Phase 11.4 — visual verify baseline

## Scope
Cerrar el bloque 11 con una base visual/manual repetible: viewports canónicos, rutas obligatorias y una checklist pequeña que futuros cierres UI puedan reutilizar sin improvisación.

## Decisions
- Se define un comando canónico `npm run verify:visual-baseline` que imprime la matriz de verify visual por viewport y ruta.
- La baseline vive en un script sin dependencias extra (`scripts/visual-verify-baseline.mjs`) para no abrir aún una capa e2e/visual más pesada.
- Se crea además un documento curado (`docs/visual-verify-baseline.md`) que explica cómo usar la checklist y qué revisar siempre.
- La matriz canónica cubre los tres viewports base (`desktop`, `tablet`, `mobile`) y las seis rutas activas del MVP.
- El cierre sigue siendo manual, pero deny-by-default: si una ruta o viewport no está en la baseline, no se da por implícitamente revisado.

## Definition of done
- existe una checklist canónica por viewport y ruta accesible desde repositorio y CLI.
- queda definido qué rutas y estados visuales se revisan siempre en cierres UI.
- la baseline es suficientemente ligera para ejecutarse sin infraestructura nueva.
- se puede reutilizar en bloques futuros como punto de partida para automatización visual.

## Verify expected
- `npm run verify:visual-baseline`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

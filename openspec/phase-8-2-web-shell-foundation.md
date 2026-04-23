# Phase 8.2 — web shell foundation

## Scope
Implementar la microfase mínima que convierte `apps/web` en un shell navegable y estable para el MVP, apoyándose en el bootstrap técnico de la fase 8.1.

## Decisions
- El shell global vive en `AppShell` y se monta desde `src/app/layout.tsx`.
- La navegación principal fija las 6 rutas canónicas: `dashboard`, `mugiwaras`, `skills`, `memory`, `vault`, `healthcheck`.
- `Topbar`, `PageHeader`, `SurfaceCard` y `StatusBadge` quedan como primitives transversales del frontend y permanecen en `apps/web/src/shared`.
- Se completan tokens mínimos de marca, superficie, estado y layout para evitar hex dispersos en los componentes del shell.
- Las rutas distintas de `dashboard` se materializan solo como placeholders finos de navegación; la lógica real de cada módulo queda fuera de esta microfase.
- `memory` y `vault` permanecen separados explícitamente también en la navegación y el copy del shell.
- `skills` sigue siendo la única superficie editable del MVP, pero en esta microfase solo se habilita su contenedor de navegación.

## Definition of done
- `AppShell`, `SidebarNav`, `Topbar`, `PageHeader`, `SurfaceCard` y `StatusBadge` existen y están integrados.
- `/dashboard` queda dentro del shell y actúa como home real del producto.
- Existen placeholders finos para `mugiwaras`, `skills`, `memory`, `vault` y `healthcheck`.
- `apps/web` compila y pasa typecheck.
- El siguiente paso queda acotado a pantallas core read-only con contenido real, no a reconstruir el shell.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- revisión manual de las 6 rutas del shell
- revisión de `git status` y `.gitignore`

## Judgment-day trigger
Lanzar `judgment-day` cuando una siguiente microfase conecte el shell con backend real, añada fetch/serialización de estados operativos o abra la primera superficie de escritura efectiva.

# Phase 10.1 — responsive shell hardening

## Scope
Abrir el bloque de refinamiento del frontend con un endurecimiento responsive del shell compartido: sidebar, topbar y layout principal.

## Decisions
- La home sigue siendo `dashboard`; no se introduce ninguna landing adicional.
- El shell mantiene navegación persistente en desktop y añade apertura/cierre móvil controlado en pantallas estrechas.
- El refinamiento se limita a `AppShell`, `SidebarNav`, `Topbar` y estilos globales del shell.
- No se introducen dependencias nuevas ni cambios de producto fuera del shell.
- Se intentó arrancar la microfase vía OpenCode/SDD, pero volvió a agotarse en `sdd-init`; el rescate se cerró fuera de OpenCode manteniendo verify real.

## Definition of done
- el shell es usable en móvil con menú lateral conmutado.
- el topbar expone control de navegación móvil.
- el overlay de cierre evita navegación tapada en pantallas pequeñas.
- el layout mantiene comportamiento estable en desktop.
- `dashboard` sigue siendo la home del producto.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

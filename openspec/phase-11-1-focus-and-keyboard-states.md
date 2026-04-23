# Phase 11.1 — focus and keyboard states

## Scope
Abrir el bloque 11 con una base real de accesibilidad e interacción por teclado: foco visible consistente, navegación móvil menos frágil y estados de selección más explícitos en superficies clave.

## Decisions
- Se introduce un patrón global de `:focus-visible` para links, botones, inputs, textarea, selects y roles interactivos comunes.
- El shell gana `skip link` al contenido principal.
- La navegación móvil mejora con `aria-controls`, cierre con `Escape`, foco inicial dentro del drawer y elementos ocultos sin tabulación accidental.
- Selectores clave (`memory`, `vault`, catálogo de `skills`) exponen mejor su estado mediante `aria-pressed` / `role=tab` / `aria-selected` donde aplica.
- El alcance se mantiene acotado: base de accesibilidad e interacción, sin abrir aún la fase de contraste fino o responsive detallado.

## Definition of done
- el foco visible es coherente en interactivos clave del MVP.
- la navegación móvil puede abrirse/cerrarse con affordance accesible y salir con `Escape`.
- existe acceso rápido para saltar al contenido principal.
- los selectores más importantes comunican mejor su estado al usar teclado/AT.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

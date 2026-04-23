# Phase 10.5 — judgment-day cleanup

## Scope
Aplicar el cleanup mínimo detectado por el judgment-day del bloque 10 sin abrir nueva funcionalidad: afinar la frontera editable de `skills`, limpiar copy desactualizado y reforzar la lectura documental de `vault`.

## Decisions
- Las skills de referencia ya no deben sentirse como un editor bloqueado.
- `Recargar skill` se trata como acción de lectura/sincronización, no como escritura productiva.
- Se eliminan referencias temporales a fases previas en copy visible.
- `vault` refuerza explícitamente su naturaleza de solo lectura documental.
- No se entra todavía en el problema más amplio de roster/conteos transversales; queda fuera por alcance de esta microfase.

## Definition of done
- una skill no editable renderiza una vista clara de referencia y no un editor productivo deshabilitado.
- la copy visible de `skills` deja de depender de referencias a `9.4`.
- `Recargar skill` está disponible como acción de lectura también en referencias.
- `vault` comunica mejor su carácter documental y de solo lectura.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

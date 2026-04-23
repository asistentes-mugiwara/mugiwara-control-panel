# Phase 9.2 — skills frontend real backend

## Scope
Conectar la pantalla `skills` del frontend al backend real de fase 9.1 sin abrir todavía guardado visible al usuario.

## Decisions
- `skills` consume catálogo, detalle y auditoría resumida desde backend real cuando existe base URL configurada.
- La UI conserva la frontera deny-by-default y no expone todavía acciones de escritura productiva.
- La base URL del backend se configura con `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL`.
- Si la base URL falta, la página cae a estado explícito `not_configured` sin romper el shell ni el build.
- Se reutilizan contratos compartidos desde `packages/contracts/src/skills.ts` mediante alias frontend `@contracts/*`.

## Definition of done
- `/skills` deja de depender principalmente de fixtures para catálogo/detalle.
- existe capa frontend de acceso HTTP al backend de skills.
- la página soporta `loading`, `ready`, `empty`, `error`, `not_configured`.
- se muestran catálogo real, detalle real y auditoría real resumida.
- `apps/api` sigue pasando tests y `apps/web` sigue pasando `typecheck` + `build`.

## Verify expected
- `python -m pytest apps/api/tests -q`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

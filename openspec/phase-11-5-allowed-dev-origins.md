# Phase 11.5 — allowedDevOrigins dev warning cleanup

## Scope
Microfase técnica post-11 para eliminar el warning de desarrollo de Next.js al inspeccionar el panel desde `127.0.0.1` mientras el dev server se levanta con `--hostname 0.0.0.0`.

## Why now
- Durante 11.3 y 11.4 el verify visual local mostró el warning `Cross origin request detected from 127.0.0.1 to /_next/* resource`.
- No afectaba a build ni a runtime productivo, pero dejaba ruido en la consola de desarrollo y Next avisa de endurecimiento futuro.
- Es un ajuste acotado, técnico y posterior al cierre del bloque 11.

## Decisions
- Se configura `allowedDevOrigins` en `apps/web/next.config.ts`.
- Se permite explícitamente `127.0.0.1` y `localhost`, que son los orígenes locales usados por el verify manual del panel.
- No se añade wildcard amplio ni origen externo: el cambio queda limitado a desarrollo local.

## Definition of done
- `next dev` deja de emitir el warning al cargar desde `http://127.0.0.1:3000`.
- `typecheck` y `build` siguen pasando.
- la baseline visual sigue ejecutando.
- el repo queda documentado en `.engram/` y con commit trazable.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:visual-baseline`
- `git diff --check`
- prueba local con `next dev` + carga de `/dashboard` desde `127.0.0.1`

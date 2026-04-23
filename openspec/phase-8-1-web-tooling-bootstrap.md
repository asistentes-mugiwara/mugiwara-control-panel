# Phase 8.1 — web tooling bootstrap

## Scope
Implementar la microfase mínima que convierte `apps/web` en una base real de Next.js para poder construir el shell del control plane en la siguiente microfase sin reabrir decisiones de tooling.

## Decisions
- `apps/web` queda arrancada como app Next.js con App Router y TypeScript.
- La raíz `/` redirige a `/dashboard` para preservar que el dashboard sea la home del producto.
- Esta microfase solo fija runtime, scripts y estructura mínima; no implementa todavía sidebar, topbar ni navegación completa.
- Los tokens iniciales viven en `apps/web/src/shared/theme/tokens.ts` y son deliberadamente mínimos hasta la microfase de shell foundation.
- Se mantiene `packages/ui` sin uso por ahora; la extracción sigue pospuesta hasta que haya masa crítica real.
- Aunque el monorepo declara `pnpm` como package manager objetivo, el arranque debe seguir siendo operable en esta máquina donde `pnpm` todavía no está en PATH.

## Definition of done
- `apps/web` tiene `package.json` con dependencias y scripts reales.
- Existen `next.config.ts`, `tsconfig.json`, `next-env.d.ts` y estructura mínima de App Router.
- `/dashboard` responde con un placeholder técnico válido.
- La raíz redirige a `/dashboard`.
- El siguiente paso queda acotado a shell foundation (`layout`, navegación, topbar, page header, componentes base y tokens completos).

## Verify expected
- instalación de dependencias de `apps/web` sin introducir artefactos versionados
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- revisión de `git status` y `.gitignore`

## Judgment-day trigger
Lanzar `judgment-day` cuando la siguiente microfase añada shell real con navegación persistente, fetch a backend o componentes que serialicen estados operativos sensibles.

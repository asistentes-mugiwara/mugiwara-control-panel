# Phase 8.1 closeout — web tooling bootstrap

## Resultado
- `apps/web` quedó arrancada como base real de Next.js con App Router y TypeScript.
- La raíz `/` redirige a `/dashboard`.
- Existe un placeholder técnico mínimo en `/dashboard`.
- Se dejaron scripts de monorepo para `dev:web`, `build:web` y `typecheck:web`.
- La siguiente microfase queda acotada a shell foundation: `layout`, navegación, topbar, page header, componentes base y tokens completos.

## Verify ejecutado
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `.gitignore` cubre `node_modules/` y `.next/` ✅
- `git status` sin artefactos de build ni secretos ✅

## Incidencia de método
- Se intentó arrancar la microfase con OpenCode en sesión nueva `phase-8-1-web-tooling-bootstrap`.
- Reintento headless sobre la misma sesión con `--session` + agente explícito.
- Ambos intentos quedaron atascados de nuevo en `sdd-init` dentro de la ventana externa.
- Se aplicó la regla de rescate inline tras el segundo fallo para no bloquear la implementación.

## Riesgos abiertos
- `pnpm` sigue sin estar disponible en PATH en esta máquina; el repo declara `pnpm@10.0.0` como package manager objetivo, pero esta microfase se verificó operativamente con `npm` dentro de `apps/web`.
- Falta todavía el shell real de navegación.

## Siguiente microfase recomendada
- `phase-8-2-web-shell-foundation`

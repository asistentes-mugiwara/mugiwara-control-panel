# Phase 11.5 closeout — allowedDevOrigins cleanup

## Resultado
- Se configura `allowedDevOrigins` en `apps/web/next.config.ts` para permitir los orígenes locales usados durante verify: `127.0.0.1` y `localhost`.
- El objetivo es limpiar el warning de Next.js en desarrollo observado durante 11.3/11.4 al usar el navegador contra `http://127.0.0.1:3000`.

## Decisión técnica
- Mantener el ajuste limitado a orígenes locales concretos.
- No usar wildcard ni abrir orígenes externos.
- Tratarlo como limpieza de DX/verify local, no como cambio funcional del MVP.

## Verify ejecutado
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `npm run verify:visual-baseline` ✅
- `git diff --check` ✅
- `next dev --hostname 0.0.0.0 --port 3000` + carga de `/dashboard` desde `127.0.0.1` sin warning `Cross origin request detected` ✅

## Riesgos abiertos
- si en el futuro se inspecciona el dev server desde otro hostname local real, habrá que añadirlo explícitamente.

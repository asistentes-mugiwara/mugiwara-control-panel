# Verify checklist — phase 8.1 web tooling bootstrap

- [ ] `apps/web` tiene dependencias y scripts reales documentados
- [ ] existen `next.config.ts`, `tsconfig.json` y `next-env.d.ts`
- [ ] existe `src/app/layout.tsx`
- [ ] existe `src/app/page.tsx` con redirección a `/dashboard`
- [ ] existe `src/app/dashboard/page.tsx` como placeholder técnico mínimo
- [ ] existe `src/shared/theme/tokens.ts`
- [ ] `npm --prefix apps/web run typecheck` pasa
- [ ] `npm --prefix apps/web run build` pasa
- [ ] `.gitignore` sigue cubriendo `node_modules/` y `.next/`
- [ ] `git status` no muestra artefactos de build ni secretos
- [ ] queda explícito que la siguiente microfase es shell foundation

# Phase 11.4 verify checklist

- [x] `npm run verify:visual-baseline`
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] `git diff --check`

## Notes
- Además del comando canónico, se comprobó carga real en navegador local y consola limpia en rutas representativas del MVP.
- La baseline queda manual/reutilizable; la automatización visual futura partirá de esta matriz.

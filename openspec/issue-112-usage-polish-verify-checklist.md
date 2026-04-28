# Issue 112 — verify checklist

## Scope checks
- [x] Alcance confirmado UI/accesibilidad only.
- [x] Sin cambios en backend, payloads, endpoints ni contratos.
- [x] Sin cambios en privacidad ni exposición de tokens raw.

## Static/code checks
- [x] `npm run verify:usage-server-only`.
- [x] `npm --prefix apps/web run typecheck`.
- [x] `npm --prefix apps/web run build`.
- [x] `npm run verify:visual-baseline`.
- [x] `git diff --check`.

## Browser/visual checks
- [x] `/usage` carga con API local de la rama en producción local (`127.0.0.1:8012` + `127.0.0.1:3018`).
- [x] Consola limpia.
- [x] Tokens largos se escanean compactos y conservan valor completo accesible (`data[value]`, `title`, `aria-label`).
- [x] Scroll interno de ventanas/perfiles tiene hint, scrollbar coloreada y sombra interna.
- [x] Selector diario expone tabs con foco visible y tabpanel etiquetado.
- [x] Sin overflow horizontal obvio en viewport disponible (`1280px`; no hubo resize real a móvil/tablet en esta herramienta).

## Review
- [ ] PR abierta.
- [ ] Handoff Usopp comentado en PR.
- [ ] Usopp invocado por vía efectiva.
- [ ] No mergear sin review válida.

# Verify checklist — Issue #121.4 Vault closeout

## Static / guardrails
- [x] `npm run verify:vault-server-only` → passed.
- [x] `npm run verify:visual-baseline` → checklist emitted.
- [x] `git diff --check` → passed.

## Web build
- [x] `npm --prefix apps/web run typecheck` → passed.
- [x] `npm --prefix apps/web run build` → passed; `/vault` dinámica (`ƒ /vault`).

## Backend regression
- [x] `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q` → 10 passed.

## Browser / HTML smoke local
- [x] `/vault` responde 200 con API real de rama (`http://127.0.0.1:3022/vault` + API `127.0.0.1:8121`).
- [x] Sin fallback visible cuando API real está activa.
- [x] Sin textos legacy: `Canon curado`, `Índice allowlisted`, `Lectura editorial`, `Pieza canónica`, `TOC sin entradas`.
- [x] Sin backend URL, `MUGIWARA_CONTROL_PANEL_API_URL`, `NEXT_PUBLIC`, rutas host ni `Traceback` en HTML/DOM visible.
- [x] Sin overflow horizontal global en viewport disponible 1280×720 (`scrollWidth === clientWidth`).
- [x] Explorer mantiene scroll interno acotado en árbol real.
- [x] Guardrail CSS fija tablet/mobile: stack desde 1100px, lector antes que explorer en móvil y explorer `max-height: 30vh`.
- [x] Tablas/código/frontmatter no fuerzan ancho horizontal global por contrato CSS (`min-width: min(520px, 100%)`, wrap interno).

## Limitación del smoke responsive
- El navegador Hermes disponible no permitió redimensionar viewport real desde la sesión browser. La evidencia responsive queda cubierta por CSS guardrail, build/typecheck y browser smoke real en 1280×720; Usopp debe revisar criterio visual de tablet/mobile en PR.

## Review
- [ ] PR comentada con handoff de Zoro.
- [ ] Usopp invocado y comentario/review recibido.
- [ ] Chopper invocado y comentario/review recibido.

## Post-merge / producción privada
- [ ] `main` actualizado tras merge.
- [ ] `npm --prefix apps/web run build` desde `main`.
- [ ] Reinicio `mugiwara-control-panel-web.service`.
- [ ] Reinicio `mugiwara-control-panel-api.service` si el smoke requiere endpoint nuevo/reciente o API persistente pudiera estar stale.
- [ ] Smoke Tailscale `http://<tailscale-ip>:3017/vault` con API real, sin fallback, sin fuga y sin overflow horizontal obvio.
- [ ] Project Summary del vault actualizado y sincronizado.
- [ ] #121 comentada/cerrada si todo queda cerrado.

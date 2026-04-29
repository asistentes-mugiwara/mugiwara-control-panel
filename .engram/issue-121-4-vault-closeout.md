# Engram closeout — Issue #121.4 Vault final closeout

## Estado
121.4 cierra el bloque #121 después de PR #125 con una microfase de hardening responsive, guardrail y docs/canon. No introduce endpoints, dependencias ni escritura nueva.

## Decisiones técnicas
- En tablet, `/vault` apila explorer y reader como dos paneles de ancho completo a partir de `max-width: 1100px`, evitando el layout intermedio anterior que dejaba el lector en una fila completa bajo un explorer estrecho.
- En móvil, se prioriza la lectura: `vault-reader-panel` pasa antes que `vault-explorer-panel`; el árbol queda abajo con `max-height: 30vh` y scroll propio.
- La indentación del árbol se capa con `clamp(8px, depth, 96px)` para evitar que carpetas profundas empujen el viewport.
- Las tablas Markdown usan `min-width: min(520px, 100%)` y wrap interno para no forzar overflow horizontal global.
- `verify:vault-server-only` queda como guardrail vivo del contrato 121.4, no solo de server-only/env.

## Verify previsto/ejecutado
- `npm run verify:vault-server-only`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q`
- `npm run verify:visual-baseline`
- `git diff --check`
- Browser smoke local y Tailscale post-merge de `/vault`.

## Follow-ups
Si tras uso real el árbol del vault se vuelve demasiado denso, valorar búsqueda/filtro o recordar colapsados como issue separada. No forma parte de 121.4.

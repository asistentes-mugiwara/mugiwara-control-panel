# Phase 16.2 verify checklist — Source-state clarity (#45)

## Scope guard
- [x] UI/copy-only.
- [x] Sin backend/API/read-model expansion.
- [x] Sin runtime config changes.
- [x] Sin nuevas fuentes ni host reads.
- [x] Sin URLs internas, rutas host, logs, comandos, stdout/stderr o raw errors expuestos.

## UX acceptance
- [x] Dashboard distingue snapshot local saneado de lectura real.
- [x] Healthcheck distingue snapshot local saneado de señales en tiempo real.
- [x] Skills distingue BFF conectado, fuente no configurada, sin datos productivos y error degradado.
- [x] Memory distingue fallback local/snapshot de lectura real.
- [x] Vault distingue fallback documental local de lectura API real.
- [x] Mugiwaras distingue fixture saneado de AGENTS.md canónico API-backed.
- [x] `not_configured` aparece solo como detalle técnico secundario.

## Verify ejecutado
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] `npm run verify:visual-baseline`
- [x] `git diff --check`
- [x] Browser smoke sobre `/dashboard`, `/healthcheck`, `/mugiwaras`, `/skills`, `/memory` y `/vault` con HTTP 200 y consola sin errores JS.

## Review esperado
- Usopp: claridad de copy/source-state.
- Chopper: no leakage en wording de config/error/source-state.

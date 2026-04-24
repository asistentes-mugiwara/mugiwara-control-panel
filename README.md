# mugiwara-control-panel

Control plane privado de Mugiwara/Hermes para observabilidad, navegación del sistema y edición controlada de skills.

## Objetivo del MVP
- Dashboard con estado general del servidor y del sistema Mugiwara
- Fichas por Mugiwara activo
- Catálogo de skills globales y por Mugiwara
- Memoria en lectura: built-in y Honcho resumido
- Vault como lector navegable
- Healthcheck operativo en lectura
- Escritura **solo** para skills permitidas

## Stack previsto
- Frontend: Next.js
- Backend: FastAPI
- Acceso remoto: Tailscale
- Arquitectura: monolito modular con clean architecture por módulo

## Reglas de seguridad del repositorio
Este repo será público en GitHub.

- Revisar `.gitignore` en cada cambio relevante.
- No subir secretos, `.env`, credenciales, logs sensibles ni artefactos locales.
- Mantener `AGENTS.md` y documentación actualizados al ritmo del código.

## Estructura inicial
- `apps/web` — shell base de Next.js ya arrancado; ver `openspec/phase-8-1-web-tooling-bootstrap.md` y `openspec/phase-8-2-web-shell-foundation.md`
- `apps/api`
- `packages/contracts`
- `packages/ui`
- `docs`
- `openspec`
- `.engram`

## Scripts útiles actuales
```bash
npm run dev:web
npm run build:web
npm run typecheck:web
npm run verify:memory-server-only
npm run verify:mugiwaras-server-only
npm run verify:skills-server-only
```

## Configuración runtime
Ver `docs/runtime-config.md`.

Resumen actual:
- `/memory`, `/mugiwaras` y `/skills` usan `MUGIWARA_CONTROL_PANEL_API_URL` como variable server-only.
- `/skills` expone al navegador solo endpoints BFF same-origin bajo `/api/control-panel/skills/**`; la URL real del backend no entra en el bundle cliente.


## OpenCode + Engram
Siempre abrir OpenCode desde la raíz del proyecto:

```bash
cd /srv/crew-core/projects/mugiwara-control-panel
opencode
```

Esto garantiza contexto correcto para agentes SDD y actualización de Engram en el espacio adecuado.

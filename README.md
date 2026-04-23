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
- `apps/web`
- `apps/api`
- `packages/contracts`
- `packages/ui`
- `docs`
- `openspec`
- `.engram`

## OpenCode + Engram
Siempre abrir OpenCode desde la raíz del proyecto:

```bash
cd /srv/crew-core/projects/mugiwara-control-panel
opencode
```

Esto garantiza contexto correcto para agentes SDD y actualización de Engram en el espacio adecuado.

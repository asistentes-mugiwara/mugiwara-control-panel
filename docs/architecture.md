# Arquitectura inicial

## Enfoque
- Monolito modular
- Frontend Next.js en `apps/web`
- Backend FastAPI en `apps/api`
- Contratos compartidos en `packages/contracts`
- UI compartida en `packages/ui` solo si hace falta

## Módulos de producto previstos
- dashboard
- mugiwaras
- skills
- memoria
- vault
- healthcheck
- system

## Principio de seguridad
El backend es la única frontera autorizada para acceder a recursos locales. La UI no debe asumir capacidades de confianza.

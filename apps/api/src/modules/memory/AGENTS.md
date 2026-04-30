# AGENTS.md — apps/api/src/modules/memory

## Rol
Módulo backend read-only para la superficie Memory.

## Reglas
- Exponer solo perfiles Mugiwara allowlisted y documentos `MEMORY.md` resueltos por el backend.
- No aceptar rutas desde el frontend ni slugs path-like; el cliente pide slugs lógicos y el backend resuelve la ubicación.
- No exponer prompts, IDs internos, observaciones completas, sesiones, secretos, rutas absolutas ni errores crudos.
- Mantener separadas las fuentes: esta superficie muestra `MEMORY.md` builtin; no mezcla Honcho, Vault ni Engram.
- Los errores deben ser semánticos y no filtrar rutas del host ni detalles internos.

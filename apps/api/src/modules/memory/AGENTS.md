# AGENTS.md — apps/api/src/modules/memory

## Rol
Módulo backend read-only para la superficie Memory.

## Reglas
- Exponer solo resúmenes saneados, contadores, badges, frescura y links allowlisted.
- No exponer dumps crudos de memoria, prompts, IDs internos, observaciones completas, sesiones ni secretos.
- Mantener separadas las fuentes `built-in` y `honcho`; Engram no se mezcla silenciosamente en esta superficie.
- No leer bases reales de memoria desde paths arbitrarios en esta microfase; usar catálogo seguro backend-owned hasta que exista conector auditado.
- Los errores deben ser semánticos y no filtrar rutas del host ni detalles internos.

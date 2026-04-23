# AGENTS.md — apps/api/src

## Rol
Código fuente del backend FastAPI.

## Reglas
- Organizar por módulos y capas, no por mezclas ad hoc.
- Cada módulo debe separar dominio, aplicación y adapters/interfaz cuando empiece a crecer.
- Mantener imports limpios y dependencias dirigidas hacia dentro.
- **Vigilar `.gitignore`** y no introducir fixtures sensibles, dumps o archivos locales.
- Actualizar este `AGENTS.md` y docs si cambia la estructura del backend.

# AGENTS.md — apps/api

## Rol
Backend FastAPI del control plane. Es la frontera de seguridad del sistema.

## Reglas
- Aplicar deny-by-default y allowlists explícitas para lectura/escritura.
- No exponer acceso arbitrario al filesystem, shell, Docker o systemd.
- Modelar el backend como monolito modular con capas claras por módulo.
- **Vigilar `.gitignore` constantemente**: no se pueden colar `.env`, logs locales, outputs sensibles, DBs locales ni artefactos del host porque el repo será público.
- Mantener documentación de endpoints, módulos y decisiones de seguridad actualizada.

# AGENTS.md — apps/api/src/modules/skills

## Rol
Módulo backend de skills: catálogo allowlisted, detalle, preview de diff y guardado auditado.

## Reglas
- Resolver siempre por `skill_id`, nunca por path libre del cliente.
- Mantener deny-by-default y validación anti path traversal/symlink.
- Limitar la escritura del MVP a `SKILL.md` allowlisted.
- Persistir auditoría mínima del backend incluso si no hay commit Git.
- **Vigilar `.gitignore`** para logs, runtime artifacts y datos efímeros.

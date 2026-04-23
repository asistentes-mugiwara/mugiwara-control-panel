# AGENTS.md — apps/web

## Rol
Frontend Next.js del control plane.

## Reglas
- La UI representa el sistema; no decide la seguridad.
- Priorizar UX clara para lectura y edición controlada de skills.
- **Vigilar `.gitignore`**: no versionar `.next`, caches, variables locales ni artefactos de build.
- Mantener documentación y este `AGENTS.md` actualizados si cambia la estructura de rutas o features.

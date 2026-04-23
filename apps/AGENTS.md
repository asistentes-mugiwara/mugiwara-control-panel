# AGENTS.md — apps

## Rol
Contiene las dos aplicaciones del monolito modular: `web` y `api`.

## Reglas
- Mantener frontera clara entre presentación y backend.
- No mover lógica de seguridad al frontend.
- **Vigilar `.gitignore` constantemente**: este repo será público y no deben entrar artefactos de build, caches, outputs locales ni secretos.
- Actualizar este `AGENTS.md` y la documentación raíz si cambia la organización de apps.

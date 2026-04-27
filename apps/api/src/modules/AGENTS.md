# AGENTS.md — apps/api/src/modules

## Rol
Módulos funcionales del backend (skills, mugiwaras, memoria, vault, healthcheck, system, git_control).

## Reglas
- Diseñar módulos cohesivos y con contratos explícitos.
- Evitar dependencias laterales caóticas entre módulos.
- Mantener arquitectura limpia por módulo.
- **Vigilar `.gitignore`** para impedir que entren snapshots, outputs o muestras sensibles.
- Si nace un módulo nuevo, documentar su propósito y actualizar este `AGENTS.md`.

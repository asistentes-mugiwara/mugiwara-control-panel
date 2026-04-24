# AGENTS.md — apps/api/src/modules/healthcheck

## Rol
Módulo backend read-only para la superficie Healthcheck.

## Reglas
- Exponer solo resúmenes saneados, módulos, eventos y señales allowlisted.
- No ejecutar shell, Docker, systemd ni leer salidas crudas del host en esta fase.
- No incluir secretos, paths absolutos, comandos, stdout/stderr ni logs crudos.
- Los estados `stale` y `not_configured` deben ser visibles y semánticos.

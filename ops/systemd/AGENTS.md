# AGENTS.md — ops/systemd

## Rol
Unidades systemd versionadas como plantillas operativas seguras.

## Reglas
- Usar unidades específicas por capacidad; no crear servicios genéricos de ejecución de comandos.
- No introducir `git fetch`, red, shell arbitrario, paths configurables o salidas crudas sin issue y review explícitos.
- Las unidades deben llamar scripts/package scripts revisados y mantener rutas de output fijas cuando haya escritura.
- Cualquier timer nuevo debe tener cadencia, persistencia y límites de superficie documentados.

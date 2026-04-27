# AGENTS.md — apps/api/src/modules/system

## Rol
Módulo backend read-only para métricas saneadas de sistema usadas por el header global.

## Reglas
- Exponer solo el endpoint fijo `GET /api/v1/system/metrics`.
- No aceptar `path`, `mount`, `device`, `command`, `url`, `method`, `host`, `target` ni parámetros cliente para elegir fuentes.
- No usar shell, `subprocess`, comandos `free`/`df`/`uptime`, Docker, systemd, discovery de filesystem ni consola host genérica.
- RAM se calcula desde fuente OS allowlisted; si se usa `/proc/meminfo`, `used = MemTotal - MemAvailable`.
- Disco usa el target backend-owned `/`, documentado públicamente solo como raíz visible por FastAPI; no serializar el path crudo.
- Uptime se deriva de fuente OS allowlisted y se serializa solo como días/horas/minutos.
- No exponer paths, mount table, devices, hostname, process list, users, raw `/proc`, stdout/stderr, logs, excepciones, stack traces, tokens ni credenciales.
- Degradar por familia (`ram`, `disk`, `uptime`) sin filtrar internals.

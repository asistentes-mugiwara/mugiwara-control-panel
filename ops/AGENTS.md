# AGENTS.md — ops

## Rol
Plantillas operativas versionadas para instalar o ejecutar integraciones locales del control plane.

## Reglas
- Mantener automatizaciones explícitas, revisables y de alcance mínimo.
- No incluir secretos, rutas privadas innecesarias, logs, salidas reales del host ni credenciales.
- Preferir runners allowlisted con rutas fijas antes que wrappers genéricos.
- Documentar cadencia, permisos, usuario efectivo y decisión de red para cada runner persistente.

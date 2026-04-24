# AGENTS.md — apps/api/src/modules/mugiwaras

## Rol
Módulo backend read-only de la sección Mugiwara.

## Reglas
- Exponer solo metadatos saneados y allowlisted de la tripulación.
- Mostrar el canon operativo desde `/srv/crew-core/AGENTS.md` como documento de solo lectura.
- No listar ni resolver por separado `/home/agentops/.hermes/hermes-agent/AGENTS.md`, porque es symlink al canon.
- No aceptar paths desde cliente ni abrir navegación arbitraria de filesystem.
- Mantener errores semánticos sin filtrar rutas reales no permitidas.

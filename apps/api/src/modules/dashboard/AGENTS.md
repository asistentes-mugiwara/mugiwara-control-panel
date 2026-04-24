# AGENTS.md — apps/api/src/modules/dashboard

## Rol
Módulo backend read-only de agregación para Dashboard.

## Reglas
- Componer solo resúmenes ya saneados y links allowlisted.
- No duplicar lógica sensible ni leer fuentes host directas.
- La agregación debe hacer visibles `stale`/`not_configured` sin filtrar detalles internos.

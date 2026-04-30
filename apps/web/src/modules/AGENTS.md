# AGENTS.md — apps/web/src/modules

## Rol
Features y módulos funcionales del frontend (dashboard, mugiwaras, skills, memoria, vault, healthcheck).

## Reglas
- Mantener una correspondencia clara entre módulo UI y módulo de producto.
- Evitar dependencias cruzadas desordenadas.
- **Vigilar `.gitignore`** y no subir mocks, capturas o outputs sensibles no saneados.
- `usage`: Usage/Codex quota read-only frontend consuming server-only current snapshot, calendar, dedicated five-hour windows and aggregated Hermes activity adapters; no client-side backend URL or Hermes profiles root exposure.
- `system`: adapter frontend server-only para `GET /api/v1/system/metrics` y view-model del header global; sin fetch de navegador, sin `NEXT_PUBLIC_*`, sin URL backend ni errores crudos en cliente.
- `git`: página `/git` (`Repos Git`) con adapter server-only para repositorios Git backend-owned; solo lectura, una card por repo con rama actual, ramas disponibles, cambios, sin trackear y último commit; sin rutas cliente, sin acciones Git ni diffs en la UI actual.
- Si nace un módulo nuevo, documentarlo aquí y en docs.

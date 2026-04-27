# AGENTS.md — apps/web/src/modules

## Rol
Features y módulos funcionales del frontend (dashboard, mugiwaras, skills, memoria, vault, healthcheck).

## Reglas
- Mantener una correspondencia clara entre módulo UI y módulo de producto.
- Evitar dependencias cruzadas desordenadas.
- **Vigilar `.gitignore`** y no subir mocks, capturas o outputs sensibles no saneados.
- `usage`: Usage/Codex quota read-only frontend consuming server-only current snapshot, calendar, dedicated five-hour windows and aggregated Hermes activity adapters; no client-side backend URL or Hermes profiles root exposure.
- Si nace un módulo nuevo, documentarlo aquí y en docs.

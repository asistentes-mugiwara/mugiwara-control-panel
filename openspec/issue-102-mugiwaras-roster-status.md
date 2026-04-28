# Issue #102 — Mugiwaras roster status canon

## Objetivo
Alinear `/mugiwaras` con el canon actual del roster definido en `/srv/crew-core/AGENTS.md`.

## Semántica fijada
- El `status` principal de una `MugiwaraCard` representa el estado operativo/canónico del Mugiwara como miembro activo del roster.
- No representa disponibilidad de datos de panel, skills, memory, MCPs ni madurez parcial de una capacidad.
- Las capacidades parciales o en standby deben expresarse en `description` o badges secundarios allowlisted, no degradando el status del agente activo a `revision` o `sin-datos`.

## Cambio técnico
- Backend `CREW_CARDS`: Usopp, Brook, Jinbe y Sanji quedan `operativo`.
- Brook mantiene el matiz de `Postgres MCP` en standby dentro de la descripción, no como status principal.
- Jinbe/Sanji actualizan copy y roles visibles hacia el canon actual.
- Fixture frontend fallback se alinea con backend, incluidos links `Ver Skills` slug-scoped.
- `verify:mugiwaras-server-only` pasa a fijar la semántica de roster activo, fixture alineado y roles Jinbe/Sanji no obsoletos.

## Verify esperado
- `PYTHONPATH=. pytest apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py -q`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:mugiwaras-server-only`
- `git diff --check`
- Smoke visual de `/mugiwaras` contra API y Next locales: sin `En revisión`, sin `Sin datos`, consola limpia y sin overflow horizontal.

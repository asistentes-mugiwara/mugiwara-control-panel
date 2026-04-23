# Phase 9.1 — skills backend allowlist + audit

## Scope
Implementar el primer vertical real del backend para `skills`: catálogo allowlisted, detalle, preview de diff, guardado auditado y contratos mínimos compartidos.

## Decisions
- El backend resuelve siempre por `skill_id`; nunca por path libre del cliente.
- Solo `SKILL.md` allowlisted bajo el árbol autorizado puede editarse en el MVP.
- `judgment-day` y otras skills de runtime pueden exponerse en lectura aunque no sean editables.
- Cada guardado o rechazo relevante deja auditoría mínima persistida por backend.
- Se introduce un primer contrato compartido real en `packages/contracts/src/skills.ts`.

## Definition of done
- existe módulo `skills` en `apps/api` con catálogo, detalle, preview y update.
- deny-by-default y anti path traversal activos.
- el guardado exige `expected_sha256` para conflicto optimista mínimo.
- la auditoría mínima queda persistida en log controlado por backend.
- tests backend pasan y el frontend sigue compilando.

## Verify expected
- `pytest` cubre catálogo, detalle, preview, guardado, rechazo por stale y rechazo por skill read-only.
- no existe path libre enviado desde frontend como fuente de verdad.
- `.gitignore` sigue cubriendo runtime y artifacts locales.
- `apps/web` sigue pasando `typecheck` y `build`.

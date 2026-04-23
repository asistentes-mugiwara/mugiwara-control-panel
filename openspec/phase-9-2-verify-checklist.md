# Verify checklist — phase 9.2 skills frontend real backend

## Comprobaciones mínimas
- [x] `/skills` consume backend real mediante capa HTTP dedicada.
- [x] La base URL se resuelve por `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` con fallback `not_configured`.
- [x] La página soporta `loading`, `ready`, `empty`, `error`, `not_configured`.
- [x] Se muestran catálogo real, detalle real y auditoría resumida real cuando la fuente responde.
- [x] La UI sigue sin exponer guardado visible/productivo.
- [x] `python -m pytest apps/api/tests -q` pasa.
- [x] `npm --prefix apps/web run typecheck` pasa.
- [x] `npm --prefix apps/web run build` pasa.
- [x] `git diff --check` pasa.

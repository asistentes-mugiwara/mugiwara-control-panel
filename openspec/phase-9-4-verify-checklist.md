# Phase 9.4 verify checklist

- [x] `python -m pytest apps/api/tests -q`
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] `git diff --check`

## Notes
- El backend ya cubría `PUT /api/v1/skills/{skill_id}` y conflicto `stale`; esta fase valida la integración frontend con ese contrato.
- La verificación de esta fase se apoya en typecheck/build del frontend y en la suite API existente.

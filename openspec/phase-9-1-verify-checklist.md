# Verify checklist — phase 9.1 skills backend allowlist + audit

## Comprobaciones mínimas
- [x] Existe módulo backend `skills` con endpoints list/detail/preview/update/audit.
- [x] La escritura se resuelve por `skill_id`, no por path libre.
- [x] Solo `SKILL.md` bajo árbol permitido puede ser editable.
- [x] `expected_sha256` protege contra guardados stale.
- [x] El backend persiste auditoría mínima en runtime controlado.
- [x] `python -m pytest apps/api/tests -q` pasa.
- [x] `npm --prefix apps/web run typecheck` pasa.
- [x] `npm --prefix apps/web run build` pasa.
- [x] `git diff --check` pasa.

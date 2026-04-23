# Verify checklist — phase 9.3 skills diff preview affordances

## Comprobaciones mínimas
- [x] Existe cliente frontend para `skills/{skill_id}/preview`.
- [x] Las skills allowlisted muestran borrador editable y affordances de preview.
- [x] Las skills read-only no ofrecen preview/edición activa.
- [x] Se muestra diff preview real cuando backend responde.
- [x] El guardado final sigue fuera de alcance en UI.
- [x] `python -m pytest apps/api/tests -q` pasa.
- [x] `npm --prefix apps/web run typecheck` pasa.
- [x] `npm --prefix apps/web run build` pasa.
- [x] `git diff --check` pasa.

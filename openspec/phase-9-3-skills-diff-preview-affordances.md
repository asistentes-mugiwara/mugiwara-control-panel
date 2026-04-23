# Phase 9.3 — skills frontend diff preview affordances

## Scope
Exponer en `skills` affordances explícitos de edición controlada y preview de diff contra backend real, sin abrir todavía guardado final en UI.

## Decisions
- La página mantiene lectura controlada como base, pero añade borrador editable solo para skills allowlisted.
- El preview de diff se solicita al backend real mediante `POST /api/v1/skills/{skill_id}/preview`.
- Las skills read-only siguen mostrando detalle, pero no activan affordances de edición.
- El guardado final sigue fuera de esta fase y debe mostrarse como no disponible todavía.
- El frontend conserva fallback `not_configured` si no existe base URL del backend.

## Definition of done
- existe cliente HTTP para preview de diff.
- `/skills` muestra borrador editable en skills allowlisted.
- la UI ofrece botones de preview y reset con estados coherentes.
- se muestra diff preview real cuando backend responde.
- no se expone guardado definitivo todavía.

## Verify expected
- `python -m pytest apps/api/tests -q`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

# Phase 9.4 — skills frontend controlled save

## Scope
Cerrar en `skills` el flujo permitido de edición del MVP, conectando la UI con el guardado real del backend allowlisted.

## Decisions
- La UI añade un campo de `actor` visible y editable antes del guardado.
- El guardado real se ejecuta mediante `PUT /api/v1/skills/{skill_id}`.
- El frontend interpreta errores estructurados del backend para distinguir conflicto `stale` de errores genéricos.
- La resolución del conflicto no pisa automáticamente el borrador local: se muestra el estado y se ofrece recarga explícita de la skill.
- Tras un guardado exitoso, la UI refresca el detalle local y antepone el registro auditado devuelto por backend.
- Las skills read-only siguen visibles, pero no permiten ni preview ni guardado.

## Definition of done
- existe cliente HTTP frontend para `PUT` con manejo de error estructurado.
- `/skills` muestra actor visible y lo exige para guardar.
- la UI permite guardar una skill editable contra backend real.
- el conflicto `stale` se muestra de forma explícita y ofrece recarga controlada.
- la operación deja feedback final visible y enlazado con la auditoría mínima.
- las skills read-only permanecen fuera del flujo de escritura.

## Verify expected
- `python -m pytest apps/api/tests -q`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

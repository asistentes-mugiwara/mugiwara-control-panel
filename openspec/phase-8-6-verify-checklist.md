# Verify checklist — phase 8.6 skills readonly + edit boundary

## Comprobaciones mínimas
- [x] `skills` ya no es un placeholder fino.
- [x] La página expresa explícitamente que la allowlist editable depende de backend.
- [x] No existe path libre enviado por frontend como fuente de verdad.
- [x] Se muestra auditoría mínima exigida antes de guardado real.
- [x] Las skills fuera de allowlist se representan como referencia read-only.
- [x] No se abren rutas detalle ni formularios de edición.
- [x] `npm --prefix apps/web run typecheck` pasa.
- [x] `npm --prefix apps/web run build` pasa.
- [x] `git diff --check` pasa.

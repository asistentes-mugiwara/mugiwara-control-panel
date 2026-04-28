# Phase 19.3 — Skills owner actor and shareable copy

## Context
Pablo pidió que la pantalla `/skills` deje de mostrar un actor manual y estados confusos como `Edición`, `Incidencia`, `Riesgo repo público` o `En revisión` pegados en móvil.

## Goals
- Mostrar el dueño real de la skill como actor de guardado.
- Usar `luffy` como dueño/actor visible para skills globales.
- Mantener todas las skills visibles como editables desde el panel.
- Sustituir el copy de riesgo público por una señal de compartibilidad:
  - `Skill compartible: Sí (sin riesgo)` cuando la señal backend es baja.
  - `Skill compartible: No (riesgo de filtrado)` cuando la señal backend es media/alta.
- Evitar chips pegados en móvil.

## Non-goals
- No abrir navegación libre por filesystem.
- No crear, borrar ni renombrar skills.
- No exponer backend URL ni rutas arbitrarias desde el navegador.
- No cambiar la política de validación de contenido `SKILL.md`.

## Implementation notes
- El backend normaliza el catálogo a `editable=true` para entradas visibles y valida escritura solo dentro de raíces allowlisteadas: `skills-source` y runtime root explícito.
- La UI calcula el actor de auditoría desde `owner_slug`: global/shared → `luffy`; agente → su slug; runtime → `runtime`.
- La UI elimina el input manual de actor y presenta `Dueño / actor de guardado` como dato calculado.
- `StatusBadge` acepta `detail` para renderizar chips autocontenidos y legibles.

## Verification
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `PYTHONPATH=. pytest apps/api/tests/test_skills_api.py apps/api/tests/test_mugiwaras_api.py -q`
- `npm run verify:skills-server-only`
- `npm run verify:visual-baseline`
- `git diff --check`
- Browser smoke local en `/skills?mugiwara=franky`: consola limpia, chips `Editable` y `Skill compartible` separados, sin `Riesgo repo público` visible.

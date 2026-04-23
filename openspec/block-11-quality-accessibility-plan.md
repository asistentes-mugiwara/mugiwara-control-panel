# Block 11 — visual hardening and accessibility

## Objective
Cerrar un bloque corto de hardening después del 10.x para consolidar claridad, accesibilidad base y verify visual razonable antes de abrir más superficie funcional.

## Why now
- El bloque 10.x ya cerró shell, estados, frontera de edición e identidad temática.
- El siguiente riesgo ya no es de producto, sino de calidad visual y accesibilidad.
- Conviene endurecer ahora contraste, foco, responsive fino y base de verificación visual antes de seguir ampliando UI.

## Planned microphases

### 11.1 Focus and keyboard states
Scope:
- estados `:focus-visible` consistentes en botones, links, inputs y tabs
- navegación por teclado sin pérdidas obvias de affordance
- contraste suficiente en outlines y elementos interactivos

Definition of done:
- elementos interactivos clave muestran foco claro
- no hay controles importantes sin affordance de teclado
- la capa temática no degrada el foco visible

Verify target:
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

### 11.2 Contrast and semantic hierarchy
Scope:
- revisar contraste de texto secundario, chips, badges y labels auxiliares
- ajustar jerarquía visual de headers, copy y cards si hace falta
- endurecer legibilidad sin perder el tono dark premium

Definition of done:
- texto secundario y labels no quedan lavados
- badges, pills y acentos siguen siendo legibles en todas las vistas principales
- se mantiene identidad sobria sin sacrificar lectura

Verify target:
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

### 11.3 Responsive fine-tuning
Scope:
- revisar saltos pequeños en móvil/tablet
- ajustar wrapping de headers, pills, badges, barras y cards densas
- evitar bloques rotos o micro-overflows en módulos principales

Definition of done:
- headers y cards críticas no colapsan mal en anchos estrechos
- pills, chips y badges envuelven con dignidad
- no hay overflows obvios en pantallas pequeñas del MVP actual

Verify target:
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

### 11.4 Visual verify baseline
Scope:
- dejar una base pequeña y sostenible para verify visual/manual repetible
- checklist de inspección por rutas clave
- si compensa, preparar base ligera para capturas o futura automatización visual

Definition of done:
- existe checklist canónica de revisión visual del MVP actual
- queda definido qué rutas y estados se deben revisar siempre
- la base sirve para futuros cierres sin improvisar verify visual

Verify target:
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

## Recommended order
1. 11.1 focus and keyboard states
2. 11.2 contrast and semantic hierarchy
3. 11.3 responsive fine-tuning
4. 11.4 visual verify baseline

## Notes
- Mantener microfases pequeñas y cerradas.
- No abrir backend ni nuevas superficies de escritura.
- Si hay conflicto entre identidad y legibilidad, gana legibilidad.

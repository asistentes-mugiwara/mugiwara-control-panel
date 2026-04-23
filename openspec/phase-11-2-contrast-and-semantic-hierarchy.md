# Phase 11.2 — contrast and semantic hierarchy

## Scope
Endurecer la legibilidad del frontend tras 11.1: contraste de tokens, badges, copy auxiliar y jerarquía de headers/paneles, además de limpiar términos mixtos o demasiado técnicos en la UI visible.

## Decisions
- Se ajustan tokens de texto y borde sutil para mejorar lectura en el tema dark sin romper la identidad visual del producto.
- `StatusBadge`, `PageHeader` y `StatePanel` se refuerzan como capas compartidas de jerarquía visual.
- Se normaliza copy visible donde aún quedaban restos de inglés o formulaciones menos naturales para producto.
- El trabajo sigue siendo solo de frontend visual/semántico; no cambia flujos funcionales.

## Definition of done
- texto secundario y muted ganan legibilidad sin perder tono.
- headers, pills y badges se sienten más jerárquicos y legibles.
- copy visible principal queda más consistente en español de producto.
- las superficies clave mantienen claridad dark premium sin verse lavadas.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

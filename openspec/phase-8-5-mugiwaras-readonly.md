# Phase 8.5 — mugiwaras readonly

## Objetivo
Convertir `mugiwaras` desde placeholder fino a una superficie read-only más realista, todavía sin backend real.

## Alcance
- fixture tipada para `mugiwara.card[]`
- `/mugiwaras` con identidad, estado, skills enlazadas, memory badge y links permitidos
- mappers/utilidades mínimas para traducir estado de modelo a UI
- documentación y verify mínimos

## Fuera de alcance
- `mugiwaras/[slug]`
- backend real o fetch
- edición
- expansión a otros módulos
- assets pesados o ilustraciones grandes

## Diseño mínimo
- usar fixture modular local en `apps/web/src/modules/mugiwaras/view-models/`
- mantener la página delgada y compuesta con `PageHeader`, `SurfaceCard` y `StatusBadge`
- mostrar solo señales saneadas y enlaces permitidos hacia rutas ya existentes

## Verificación
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- comprobación manual de `/mugiwaras` dentro del shell

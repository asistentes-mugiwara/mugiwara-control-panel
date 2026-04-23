# Phase 3 — frontend shell design

## Scope
Diseñar `apps/web` como shell de lectura y navegación del control plane, alineado con la frontera backend definida en fase 2.

## Decisions
- La navegación principal del MVP será: dashboard, mugiwaras, skills, memory, vault, healthcheck.
- `skills` es el único módulo con edición prevista en MVP; el resto se diseña como lectura.
- El frontend se organiza en `app`, `modules` y `shared`.
- Los estados mínimos por módulo son: `loading`, `ready`, `empty`, `error` y `stale` cuando aplique.
- El cliente no filtra secretos ni aplica políticas de acceso al host; eso vive en backend.

## Definition of done
- shell frontend documentado
- navegación principal definida
- módulos frontend delimitados
- estados de UI documentados por recurso
- separación cliente/servidor explicitada

## Verify expected
- coherencia con la fase 2 backend
- ausencia de nuevas superficies de escritura fuera de `skills`
- alineación entre docs y openspec

## Judgment-day trigger
Lanzar `judgment-day` cuando el shell pase a implementación real con:
- formularios de edición
- fetch contra backend real
- serialización de estados operativos sensibles
- cambios no triviales en routing, hydration o fronteras cliente/servidor

# Phase 8.3 — dashboard + healthcheck readonly

## Scope
Materializar una microfase frontend read-only que reemplace placeholders de `/dashboard` y `/healthcheck` por vistas mínimas con contratos tipados de fixture para `dashboard.summary` y `healthcheck.summary[]`, sin integración backend.

## Decisions
- Se adopta estrategia fixture-first tipada por módulo en `apps/web/src/modules/{dashboard,healthcheck}/view-models`.
- Las páginas de `app/*` quedan delgadas: componen UI y leen view-models ya definidos.
- `severity` y `status` se mantienen separados en `healthcheck.summary[]` con mapeos explícitos.
- `dashboard` muestra solo agregado seguro: contadores, severidad más alta, frescura y enlaces a módulos.
- `healthcheck` muestra checks saneados: estado, frescura, warning corto y origen saneado.

## Definition of done
- Existe fixture tipada de `dashboard.summary` y `/dashboard` la consume.
- Existe fixture tipada de `healthcheck.summary[]` y `/healthcheck` la consume.
- `/dashboard` deja de ser placeholder y muestra counters, highest severity, freshness y links.
- `/healthcheck` deja de ser placeholder y muestra checks saneados con status/freshness/warning/source.
- No se agrega fetch/network ni superficies de escritura.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- Revisión manual de `/dashboard` y `/healthcheck` (solo lectura, sin datos crudos ni host leakage)

## Judgment-day trigger
Aplicar `judgment-day` cuando esta microfase pase de fixtures a backend real o cuando se expanda a acciones operativas fuera del alcance read-only.

# Contratos compartidos — fase 4

## Objetivo
Definir `packages/contracts` como capa de contratos compartidos entre frontend y backend para el MVP.

## Principios
- Los contratos describen recursos, estados y errores; no contienen lógica de negocio.
- Deben ser estables, tipados, predecibles y orientados a consumo por agentes.
- Un contrato nuevo debe justificarse por reutilización real entre frontend y backend.
- El contrato nunca debe exponer datos más sensibles que la política del backend permite.

## Recursos del MVP
- `dashboard`
- `mugiwaras`
- `skills`
- `memory`
- `vault`
- `healthcheck`
- `system`

## Shape base de respuesta
Todos los recursos compartidos deberían poder expresarse sobre una base común:
- `resource`: nombre canónico del recurso
- `status`: `ready | empty | error | stale`
- `data`: payload tipado del recurso
- `meta`:
  - `generated_at`
  - `source`
  - `stale_after` cuando aplique
  - `warnings` opcionales

## Patrones por tipo de endpoint
### Colección
- `items`
- `count`
- `filters` opcionales
- `meta`

### Detalle
- `id` o clave del recurso
- `data`
- `meta`

### Resumen operativo
- `status`
- `summary`
- `checks` o `signals`
- `meta`

## Errores compartidos
Los errores deben separarse en categorías semánticas, no solo mensajes libres:
- `not_found`
- `not_configured`
- `forbidden`
- `source_unavailable`
- `validation_error`
- `internal_error`

## Estados compartidos
### `ready`
El recurso se puede renderizar con datos útiles.

### `empty`
El recurso existe pero no tiene datos útiles todavía.

### `error`
Fallo al obtener o transformar el recurso.

### `stale`
El recurso existe pero su frescura operativa está fuera del umbral aceptable.

## Reglas de diseño de contratos
- evitar nombres ambiguos
- timestamps siempre explícitos
- no mezclar payload de UI con payload de infraestructura
- permitir composición por agentes sin parsers frágiles
- versionar cambios breaking de forma visible

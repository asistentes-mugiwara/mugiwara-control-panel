# Shell frontend — fase 3

## Objetivo
Diseñar `apps/web` como shell de lectura y navegación del control plane.

## Principios
- El frontend representa estado y conocimiento; no decide seguridad.
- Toda mutación permitida en MVP debe apoyarse en contratos explícitos del backend.
- La navegación principal debe ser estable, predecible y fácil de consumir por agentes.
- La separación cliente/servidor debe reducir acoplamiento, no esconder lógica crítica.

## Navegación principal
- `dashboard`
- `mugiwaras`
- `skills`
- `memory`
- `vault`
- `healthcheck`

## Estructura de shell propuesta
### `apps/web/src/app`
- layout global
- routing principal
- providers de sesión/consulta si se necesitan
- composición de shell, no lógica profunda de dominio

### `apps/web/src/modules`
- `dashboard`
- `mugiwaras`
- `skills`
- `memory`
- `vault`
- `healthcheck`

### `apps/web/src/shared`
- componentes transversales
- estado UI común
- contratos de presentación
- utilidades de fetch/view-model solo si son genuinamente compartidas

## Reglas cliente/servidor
- Los datos sensibles se filtran en backend, nunca en cliente.
- El cliente no compone rutas de filesystem ni permisos por su cuenta.
- El frontend consume recursos tipados y resumidos.
- La UI puede modelar estados y navegación, pero no reglas de autorización.

## Módulos de lectura del MVP
### Dashboard
- estado general del servidor y del sistema
- tarjetas de navegación
- señales resumidas de salud operativa

### Mugiwaras
- tarjeta/lista por agente activo
- ficha con estado, identidad, built-in y skills relacionadas

### Skills
- lista global y por Mugiwara
- lectura + edición controlada en MVP

### Memory
- built-in por Mugiwara
- Honcho solo como estado + facts resumidos
- sin absorber Vault ni Engram como memoria global

### Vault
- módulo propio de navegación y lectura

### Healthcheck
- cronjobs, backups, gateways, honcho, docker y señales del sistema en lectura

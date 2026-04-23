# Superficie de observabilidad y lectura

## Objetivo
Definir las superficies de lectura del MVP para que agentes y operadores puedan inspeccionar estado y contexto sin introducir nuevas capacidades de escritura.

## Principio rector
Todo este bloque es **read-only**. La única escritura permitida del MVP sigue siendo `skills` bajo allowlist y trazabilidad explícita.

## Superficies cubiertas
- `dashboard`
- `healthcheck`
- `memory`
- `vault`
- `mugiwaras`

## Arquitectura de lectura
Se adopta una arquitectura **resource-first**:
- cada superficie tiene contrato propio de resumen y detalle
- `dashboard` y las fichas de Mugiwara solo agregan resúmenes ya saneados
- ninguna vista lee fuentes brutas directamente ni mezcla lectura con controles de acción

## Prioridad de rutas
1. `/dashboard` — entrada operativa global
2. `/healthcheck` — estado operativo del sistema
3. `/memory` y `/memory/[mugiwara]` — vista de memoria general y detalle por agente
4. `/vault` y `/vault/[...path]` — índice navegable y documento allowlisted
5. `/mugiwaras` y `/mugiwaras/[slug]` — tarjetas y perfil detallado

## Responsabilidad por superficie
### Dashboard
Debe mostrar:
- contadores agregados
- frescura de datos
- severidad más alta visible
- enlaces a módulos propietarios

No debe mostrar:
- logs brutos
- paths del host
- salidas de comandos
- blobs completos de otras superficies

### Healthcheck
Debe mostrar:
- nombre del check
- estado semántico
- frescura
- aviso corto saneado
- etiqueta de origen saneada

No debe mostrar:
- salida cruda de procesos
- contenido de unidades systemd
- IDs internos sensibles
- metadata arbitraria del host

### Memory
Debe mostrar:
- resumen built-in por agente
- contadores/facts relevantes
- última actualización
- facts Honcho acotados y saneados

No debe mostrar:
- dumps completos de conversación
- prompts crudos
- mezclas no controladas entre proyectos
- identificadores ocultos o sensibles

### Vault
Debe mostrar:
- estructura navegable allowlisted
- metadata de índice
- documento markdown ya autorizado

No debe mostrar:
- ficheros ocultos
- blobs binarios
- navegación libre por filesystem
- rutas fuera del árbol permitido

### Mugiwaras
Debe mostrar:
- identidad
- estado
- skills enlazadas
- badge/resumen de memoria
- metadata de perfil permitida

No debe mostrar:
- config editable
- secretos
- tokens
- referencias libres al host o al runtime

## Estados visibles compartidos
Estados base:
- `loading`
- `ready`
- `empty`
- `error`
- `stale`

Estados acotados adicionales donde proceda:
- `forbidden`
- `not_configured`

Regla: el significado de cada estado debe ser consistente para agentes y UI; nunca debe filtrar detalle sensible del backend.

## Separación lectura/escritura
- estas superficies no definen create/update/delete/execute
- no incluyen formularios operativos ni quick actions de control
- cualquier intento de escritura fuera de `skills` debe tratarse como `forbidden`

## Saneamiento y trust boundary
El saneamiento ocurre en backend antes de serializar respuesta:
- deny-by-default
- allowlists explícitas por superficie
- exclusión de campos desconocidos
- no se delega seguridad al frontend

## Contratos esperados
La base sigue siendo:
- `resource`
- `status`
- `data`
- `meta`

Formas documentadas de esta fase:
- `dashboard.summary`
- `healthcheck.summary[]`
- `memory.agent_summary`
- `memory.agent_detail`
- `vault.index`
- `vault.document`
- `mugiwara.card`
- `mugiwara.profile`

## Conclusión
La observabilidad del MVP debe ser lectura primero, modular y saneada. `dashboard` agrega; los módulos propietarios detallan. Ninguna de estas superficies debe convertirse en puerta lateral de escritura o fuga de información del host.

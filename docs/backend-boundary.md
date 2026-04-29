# Frontera backend — fase 2

## Objetivo
Diseñar `apps/api` como la frontera de seguridad deny-by-default del control plane.

## Principios
- La UI nunca accede directamente al filesystem ni al host.
- Toda lectura pasa por adaptadores backend explícitos y auditables.
- Toda escritura fuera de la superficie permitida está prohibida por defecto.
- La seguridad se expresa en contratos, módulos y allowlists, no en convenciones implícitas.

## Regla deny-by-default
Todo recurso o acción cae en uno de estos estados:
- `denied` por defecto
- `read-allowed` si está expresamente listado
- `write-allowed` solo si existe decisión de producto y validación específica

## Recursos del MVP
### Solo lectura
- `mugiwaras`
- `memory/builtin`
- `memory/honcho-summary`
- `vault`
- `healthcheck`
- `system`

### Escritura permitida
- `skills` únicamente sobre rutas permitidas de skills y ficheros autorizados para el MVP

## Allowlists de rutas
### Lectura permitida
- `/srv/crew-core/skills-source/**`
- `/srv/crew-core/vault/**`, solo mediante módulos backend read-only con root fijo, rutas relativas saneadas y exclusión de hidden/symlinks/oversized cuando se navega como árbol
- `/home/agentops/.hermes/profiles/**/config.yaml`
- `/home/agentops/.hermes/profiles/**/memories/*.md`
- fuentes operativas resumidas/saneadas de healthcheck y cron que se definan como input del módulo `healthcheck`

### Lectura prohibida salvo decisión explícita posterior
- `.env`
- tokens, credenciales, cookies
- logs crudos del host sin saneado
- rutas arbitrarias del filesystem
- salidas de comandos libres

### Escritura permitida en MVP
- ficheros de skills explícitamente autorizados por política del módulo `skills`

### Escritura prohibida en MVP
- vault
- built-in memory
- honcho
- config de perfiles
- artefactos de sistema
- cronjobs
- servicios

## Patrón de acceso
Cada request debe seguir esta secuencia:
1. endpoint HTTP -> interface layer
2. caso de uso -> application layer
3. policy check -> autorización por recurso/capacidad
4. adapter -> acceso controlado a fuente local
5. sanitizer -> reducción de superficie expuesta
6. serializer -> contrato estable de salida

## Regla de saneado
Antes de salir del backend, toda respuesta debe poder contestar:
- ¿expone una ruta sensible innecesaria?
- ¿expone un secreto o identificador operativo?
- ¿mezcla datos canónicos con datos efímeros?
- ¿devuelve más detalle del necesario para el módulo consumidor?

## Riesgos prioritarios
- fuga de secretos por lectura demasiado amplia
- path traversal o allowlists mal implementadas
- healthchecks demasiado verbosos
- confusión entre recursos de lectura y escritura
- drift entre contratos y fuentes reales

# Endurecimiento de entrega

## Objetivo
Cerrar la base de gobernanza del repo para que el proyecto pueda crecer sin exponer secretos, artefactos locales ni deriva documental.

## Principio rector
Este repositorio es público. La política de entrega debe ser **deny-by-default** para cualquier artefacto local o sensible.

## Reglas de gobernanza
### 1. Artefactos ignorados por defecto
Nunca debe versionarse sin justificación explícita y saneada:
- secretos y ficheros `.env`
- credenciales, certificados, claves o tokens
- logs locales y salidas diagnósticas sensibles
- caches, outputs de runtime y artefactos efímeros del host
- carpetas de tooling/agentes salvo whitelisting deliberado
- binarios, exports o snapshots locales no pensados para el repo público

### 2. Excepciones permitidas
Solo se permiten ejemplos saneados cuando:
- existe necesidad documental real
- el contenido es seguro para repo público
- la excepción queda explicada en docs
- no se confunde el ejemplo con output operativo real

### 3. Higiene de worktree
Una fase documental/política no debe darse por cerrada si:
- hay cambios tracked fuera del alcance acordado
- el worktree mezcla trabajo viejo con artefactos de cierre nuevos
- no está claro qué cambios forman parte del cierre

### 4. Documentación viva alineada
Cuando cambie una regla de entrega deben moverse en el mismo cambio, si aplica:
- `README.md`
- `AGENTS.md`
- `docs/`
- `openspec/`

Objetivo: evitar policy drift entre canon, operación y planning.

### 5. Trazabilidad de decisiones
Cualquier cambio relevante en la política de entrega debe dejar:
- explicación corta del cambio
- motivo
- dónde aplica
- riesgo mitigado o limitación conocida

## Gate de cierre recomendado
Antes de cerrar una mini-fase:
1. revisar `.gitignore`
2. revisar `git status`
3. confirmar que no hay artefactos locales inseguros
4. confirmar que docs y openspec relevantes están alineados
5. dejar closeout en `.engram/`

## Relación con el runtime SDD
Para trabajo headless con OpenCode:
- usar prompt seguro por fichero
- evitar relanzar `sdd-init` innecesariamente
- en continuaciones, fijar `--session` + `--agent sdd-orchestrator-zoro`
- no asumir persistencia en Engram sin comprobar observaciones reales

## Límite de esta fase
Esta fase define gobernanza y preparación. No introduce automatización de enforcement ni sustituye `verify` o `archive` futuros.

## Conclusión
El endurecimiento de entrega no consiste solo en ampliar `.gitignore`; consiste en mantener un repo público limpio, trazable y alineado documentalmente antes de abrir fases de implementación.

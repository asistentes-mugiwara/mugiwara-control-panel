# Módulos backend — fase 2

## Estructura objetivo en `apps/api/src/modules`
- `skills`
- `mugiwaras`
- `memory`
- `vault`
- `healthcheck`
- `system`

## Responsabilidad por módulo
### `skills`
- listar skills globales y por Mugiwara
- leer detalle de skill
- validar política de escritura del MVP
- escribir únicamente sobre superficies autorizadas

### `mugiwaras`
- componer ficha por agente
- agregar estado, identidad, built-in memory resumida y skills relacionadas
- exponer `GET /api/v1/mugiwaras` y `GET /api/v1/mugiwaras/{slug}` como superficies read-only
- mostrar `/srv/crew-core/AGENTS.md` como documento canónico de reglas operativas en la sección Mugiwara; esta lectura pertenece al control plane privado y no debe exponerse fuera de la frontera operativa/autenticada del despliegue
- no listar ni resolver por separado `/home/agentops/.hermes/hermes-agent/AGENTS.md`, porque es symlink al canon
- no escribir sobre perfiles

### `memory`
- exponer `GET /api/v1/memory` como catálogo read-only de resúmenes saneados por agente
- exponer `GET /api/v1/memory/{slug}` como detalle read-only acotado
- exponer built-in memory solo como resumen allowlisted, nunca como dump crudo
- exponer Honcho solo como facts resumidos y estado de frescura
- dejar Engram modelado por proyecto en una fase posterior
- no exponer prompts, IDs internos, sesiones, observaciones completas, tokens ni secretos

### `vault`
- navegación, árbol, índices y lectura de markdown
- sin escritura en MVP

### `healthcheck`
- resumir cronjobs, backups, gateways, honcho, docker y checks operativos
- consumir fuentes saneadas y timestamps de frescura

### `system`
- estado general del servidor y señales operativas de alto nivel
- evitar convertirlo en consola de administración

## Capas por módulo
Cada módulo debe poder crecer con estas capas:
- `domain/`
- `application/`
- `infrastructure/`
- `interface/`

Para la fase actual basta documentarlo; no es obligatorio crear todos los directorios todavía.

## Shared backend
`apps/api/src/shared` debe contener solo:
- errores comunes
- tipos de política/autorización
- utilidades de saneado
- contratos base de respuesta
- helpers genuinamente transversales

## Regla agent-first
Los módulos backend deben ser fáciles de consumir por agentes:
- nombres de recurso estables
- respuestas tipadas y predecibles
- estados observables
- sin side effects implícitos
- capacidad/permiso visible en cada caso de uso

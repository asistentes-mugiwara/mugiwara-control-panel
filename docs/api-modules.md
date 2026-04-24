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
- mostrar `/srv/crew-core/AGENTS.md` como documento canónico de reglas operativas en la sección Mugiwara
- no listar ni resolver por separado `/home/agentops/.hermes/hermes-agent/AGENTS.md`, porque es symlink al canon
- no escribir sobre perfiles

### `memory`
- exponer built-in memory en lectura
- exponer Honcho solo como estado + facts resumidos
- dejar Engram modelado por proyecto en una fase posterior

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

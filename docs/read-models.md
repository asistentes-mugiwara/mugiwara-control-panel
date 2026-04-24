# Modelos de lectura del MVP

## Objetivo
Fijar el shape conceptual de los modelos de lectura que consumirán frontend y agentes para las superficies de observabilidad.

## Base compartida
Todos los recursos usan la envoltura común:
- `resource`
- `status`
- `data`
- `meta`

## Modelos por recurso
### `dashboard.summary`
Campos esperados:
- `sections`
- `highest_severity`
- `freshness`
- `counts`
- `links`

Uso:
- entrada global de operador
- navegación hacia superficies propietarias

### `healthcheck.summary[]`
Campos esperados:
- `check_id`
- `label`
- `severity`
- `status`
- `freshness`
- `warning_text`
- `source_label`

Uso:
- panorama de checks saneados
- drilldown controlado sin exponer salidas crudas

### `memory.agent_summary`
Campos esperados:
- `mugiwara_slug`
- `summary`
- `fact_count`
- `last_updated`
- `badges`

### `memory.agent_detail`
Campos esperados:
- `mugiwara_slug`
- `built_in_summary`
- `honcho_facts`
- `freshness`
- `links`

Uso:
- visión resumida y detalle acotado de memoria por agente

### `vault.index`
Campos esperados:
- `path`
- `entries`
- `breadcrumbs`
- `freshness`

### `vault.document`
Campos esperados:
- `path`
- `title`
- `markdown`
- `updated_at`
- `breadcrumbs`

Uso:
- árbol navegable allowlisted y lectura de documento permitido

### `mugiwara.card`
Campos esperados:
- `slug`
- `name`
- `status`
- `skills`
- `memory_badge`
- `links`

### `mugiwara.crew_rules_document`
Campos esperados:
- `document_id`
- `title`
- `display_path`
- `source_label`
- `read_only`
- `canonical`
- `markdown`

Uso:
- mostrar en la sección Mugiwara el `/srv/crew-core/AGENTS.md` canónico en modo solo lectura
- tratar esta lectura como superficie del control plane privado; si el API se expone fuera del perímetro operativo, debe ir detrás de auth/permisos antes de servir markdown completo
- no listar `/home/agentops/.hermes/hermes-agent/AGENTS.md` como fuente distinta, porque es symlink al canon

### `mugiwara.profile`
Campos esperados:
- `slug`
- `identity`
- `status`
- `allowed_metadata`
- `linked_skills`
- `memory_summary`

Uso:
- tarjetas y perfil detallado sin controles de escritura

## Reglas de modelado
- `dashboard` y `mugiwara.card` agregan solo resúmenes ya saneados
- ningún modelo incluye blobs arbitrarios, secretos o paths del host
- campos no allowlisted se excluyen por defecto
- los errores de backend se traducen a estados explícitos, no a volcados técnicos

## Estados semánticos
Base compartida:
- `loading`
- `ready`
- `empty`
- `error`
- `stale`

Estados adicionales:
- `forbidden`
- `not_configured`

## Meta mínima esperada
`meta` debe poder incluir, cuando proceda:
- `freshness`
- `source`
- `sanitized`
- `links`
- `version`

Siempre de forma segura y acotada.

## Conclusión
Estos modelos de lectura fijan una base estable para implementación posterior. El objetivo no es expresar todo el origen, sino exponer exactamente la información mínima y segura que un agente u operador necesita para navegar e interpretar el sistema.

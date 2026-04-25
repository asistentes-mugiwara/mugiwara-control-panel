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
- `sections[]` con `id`, `label` y estado saneado (`healthy`, `warning`, `degraded`)
- `highest_severity` (`low`, `medium`, `high`, `critical`)
- `freshness` con `updated_at`, `label` y `state`
- `counts[]` con `label`, `value` y `note`
- `links[]` allowlisted

Uso:
- entrada global de operador
- navegación hacia superficies propietarias
- agregación backend-owned de resúmenes ya saneados

### `healthcheck.workspace`
Campos esperados:
- `summary_bar`
- `modules[]`
- `events[]`
- `principles[]`
- `signals[]`

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

#### Vocabulario backend-owned de fuentes Healthcheck
Phase 15.2a fija el vocabulario de contratos antes de conectar fuentes vivas. Los IDs de fuente y `check_id` salen de allowlists del backend, nunca de input cliente, paths descubiertos ni servicios detectados dinámicamente.

Estados permitidos:
- `status`: `pass`, `warn`, `fail`, `stale`, `not_configured`, `unknown`
- `severity`: `low`, `medium`, `high`, `critical`, `unknown`
- `freshness.state`: `fresh`, `stale`, `unknown`

Familias/fuentes estables para el bloque Phase 15:
- `vault-sync` -> `vault-sync.last-sync`
- `project-health` -> `project-health.workspace`
- `backup-health` -> `backup-health.last-backup`
- `hermes-gateways` -> `hermes-gateways.global`
- `gateway.<mugiwara-slug>` -> `gateway.<mugiwara-slug>.process`, para `luffy`, `zoro`, `nami`, `usopp`, `sanji`, `chopper`, `robin`, `franky`, `brook`, `jinbe`
- `cronjobs` -> `cronjobs.registry`

Phase 15.2a no añade lecturas vivas: no lee manifiestos, filesystem, Git/GitHub, systemd ni cronjobs reales. La compatibilidad actual se mantiene como catálogo saneado fixture-backed con IDs ya alineados a este vocabulario.

Phase 15.2b añade una normalización backend-owned previa a futuras fuentes vivas. Los adapters futuros entregarán payloads ya resumidos al registro de fuentes; el registro resuelve `label` desde `HEALTHCHECK_SOURCE_LABELS[source_id]`, solo copia una allowlist mínima (`status`, `severity`, `updated_at`, `summary`, `warning_text`, `source_label`, `freshness_label`, `freshness_state`) y descarta campos desconocidos antes de que lleguen al modelo serializable. Ausencias, fuentes no legibles y adapters no registrados se representan como `not_configured` o `unknown`, nunca como `pass` silencioso. Los errores de source ID no deben ecoar el valor rechazado para evitar filtrar paths, comandos o nombres internos.

Issue #34 / Phase 15.3 prerequisite añade defensa en profundidad para campos textuales permitidos antes de conectar adaptadores vivos. `HealthcheckSourceRegistry` no acepta `label` del adaptador: lo resuelve desde vocabulario backend-owned. Además filtra marcadores sensibles dentro de `summary`, `warning_text`, `source_label` y `freshness_label`; si detecta rutas host, `.env`, tokens, credenciales, salidas crudas, comandos, tracebacks, journals, prompts, chat IDs, delivery targets o metadatos Git internos, sustituye el texto por un fallback genérico saneado preservando estado, severidad y frescura.

Phase 15.2c adds static guardrails, manifest ownership and freshness thresholds before live adapters. The detailed policy lives in `docs/healthcheck-source-policy.md`; it defines Franky/Zoro ownership per source family, safe location classes, explicit exclusions for raw host data and initial warn/fail thresholds.

Phase 15.3a connects the first live source: `vault-sync`. The adapter reads only a fixed Franky-owned status manifest, derives `pass`/`warn`/`stale`/`fail` from safe result and timestamp fields, routes output through `HealthcheckSourceRegistry`, and degrades missing or unreadable manifests to `not_configured`/`unknown`. It does not expose manifest paths, branch names, Git output, raw fields or remotes, and it does not add backup/project/gateway/cronjob reads.

Phase 15.3b connects the second live source: `backup-health`. The adapter reads only a fixed Franky-owned local backup status manifest, consumes safe status/timestamp/checksum/retention fields, routes output through `HealthcheckSourceRegistry`, and degrades missing or unreadable manifests to `not_configured`/`unknown`. It does not expose archive names, backup paths, included paths, stdout/stderr, raw output, file sizes or runtime manifest internals, and it does not add project/gateway/cronjob reads.

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
- mantener visible la distinción built-in/Honcho sin mezclar Engram
- no exponer prompts, dumps crudos, IDs internos, sesiones ni observaciones completas

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
- si el frontend usa fallback documental por fallo de API, el estado degradado debe quedar visible y no confundirse con lectura real del vault

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

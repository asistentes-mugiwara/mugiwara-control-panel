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

Phase 15.4a connects the third live source: `project-health`. The adapter reads only a fixed Zoro-owned repo-local status manifest, consumes safe status/timestamp plus boolean `workspace_clean`, `main_branch` and `remote_synced` semantics, routes output through `HealthcheckSourceRegistry`, and degrades missing or unreadable manifests to `not_configured`/`unknown`. It does not execute Git, expose raw branch names, remotes, diffs, untracked file lists, GitHub counts or last-verify detail, and it does not add gateway/cronjob reads.

Phase 15.4b adds the Zoro-owned manifest producer for `project-health`. `scripts/write-project-health-status.py` may query the local Git repo outside the backend, but the manifest still serializes only `status`, `result`, `updated_at`, `workspace_clean`, `main_branch` and `remote_synced`. It writes atomically with non-public permissions and does not include branch names, remotes, SHAs, diffs, untracked files, stdout/stderr, paths, GitHub counts or last-verify detail.

Phase 15.5a connects the gateway status read side through a fixed Franky-owned manifest reader. `GatewayStatusManifestAdapter` emits the aggregate `hermes-gateways` source plus one allowlisted `gateway.<mugiwara-slug>` source for each Mugiwara slug. It consumes only safe timestamp and active/enum state semantics, routes every record through `HealthcheckSourceRegistry`, degrades absent/unreadable/partial data visibly, and does not execute systemd from the backend or expose PIDs, command lines, unit files, journal output, environment values, runtime paths or restart logs.

Phase 15.5b adds the Franky-owned producer/runner for that gateway manifest. `scripts/write-gateway-status.py` runs outside the backend, only checks allowlisted `hermes-gateway-<slug>.service` active state via `systemctl --user is-active`, writes atomically to `/srv/crew-core/runtime/healthcheck/gateway-status.json` with non-public permissions, fsyncs the parent directory after `os.replace`, and serializes only `status`, `result`, `updated_at` and per-slug `active` booleans. The CLI `--output` option is retained only for tests/manual controlled runs; the installed user-level `mugiwara-gateway-status.timer`, installed by `scripts/install-gateway-status-user-timer.sh`, refreshes the fixed path every 2 minutes with `TimeoutStartSec=30s` and does not pass alternate output paths or inspect journal output, unit file contents, PIDs, command lines, env values, logs or stdout/stderr.

Phase 15.6a connects the cronjobs read side through a fixed Franky-owned manifest reader. `CronjobsManifestAdapter` consumes only aggregate manifest status/timestamp plus per-job safe `last_run_at`, `last_status` and `criticality` semantics, routes the result through `HealthcheckSourceRegistry`, degrades absent/unreadable/empty/partial registries visibly, and does not expose job names, owner profiles, prompt bodies, commands, chat IDs, delivery targets, logs, stdout/stderr or raw outputs. It does not add a cronjobs producer yet.

Phase 15.6b adds the Franky-owned producer/runner for that cronjobs manifest. `scripts/write-cronjobs-status.py` reads allowlisted Hermes profile cron registries outside the backend, filters to enabled recurring jobs with a recorded run unless they are critical, writes atomically to `/srv/crew-core/runtime/healthcheck/cronjobs-status.json` with non-public permissions, and serializes only `status`, `result`, `updated_at` and per-job `last_run_at`, `last_status`, `criticality`. Phase 15.7a hardens the producer with a fixed 1 MiB registry size limit before `json.loads`; oversized registries fail closed without parsing or serializing their content. The frequent vault-sync cron is marked critical. The user-level `mugiwara-cronjobs-status.timer`, installed by `scripts/install-cronjobs-status-user-timer.sh`, refreshes it every 5 minutes and does not serialize job names, owner profiles, prompt bodies, commands, delivery targets, chat IDs, logs, stdout/stderr, raw outputs, host paths, tokens or credentials.

Issue #43 automates the project-health producer with the user-level `mugiwara-project-health-status.timer` installed by `scripts/install-project-health-status-user-timer.sh`. The timer runs every 15 minutes after boot via `npm run write:project-health-status`, does not run `git fetch`, does not override the fixed manifest output, and `remote_synced` compares `HEAD` with the local upstream ref. A future network-refresh runner must be reviewed separately if operations decide the local upstream ref should be refreshed before each manifest write.

Phase 15.8 closes the Healthcheck real-source block through 15.7b. Canonical state: readers exist for `vault-sync`, `backup-health`, `project-health`, `gateway-status` and `cronjobs`; producers/runners exist for `project-health`, `gateway-status` and `cronjobs-status`; `vault-sync-status` and `backup-health-status` producers remain explicit follow-ups rather than blockers. Healthcheck still degrades missing/unreadable fixed manifests visibly and must not expose host internals.

### `usage.current`
Campos esperados:
- `current_snapshot` con `captured_at`, `source_label` y `freshness`
- `plan` con tipo de plan, `allowed`, `limit_reached` y límites adicionales
- `primary_window` para la `Ventana 5h`: porcentaje usado, rango, reset y estado
- `secondary_cycle` para el `Ciclo semanal Codex`: porcentaje usado, rango, reset y estado
- `recommendation` con estado/copy operativo
- `methodology` con fórmulas de reset y privacidad

Uso:
- responder rápido si la ventana 5h o el ciclo semanal Codex están en zona normal/alta/crítica
- mantener explícito que el ciclo semanal Codex no equivale a semana natural lunes-domingo
- exponer solo métricas saneadas desde la fuente SQLite allowlisted, sin email, user/account IDs, tokens, prompts, headers, logs ni raw payload
- degradar fuente ausente/ilegible a `not_configured`/`unknown` sin path runtime

### `usage.calendar`
Campos esperados:
- `range` (`current_cycle`, `previous_cycle`, `7d`, `30d`)
- `timezone` fija `Europe/Madrid`
- `current_cycle` con rango del ciclo semanal Codex de referencia
- `days[]` con fecha natural, tramo Codex del día, delta diario del ciclo semanal Codex calculado por segmento continuo de ciclo para no contar resets como consumo, número de ventanas 5h, pico 5h y estado diario saneado

Uso:
- exponer calendario por fecha natural como primera vista histórica de Usage
- indicar `tramo parcial` solo cuando la fecha coincide con inicio/reset del ciclo semanal Codex
- no incluir actividad Hermes, prompts, conversaciones, tokens, raw payload, rutas runtime ni causalidad por perfil
- aceptar solo rangos allowlisted; valores desconocidos deben caer en error de validación saneado sin ecoar input

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

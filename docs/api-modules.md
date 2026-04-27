# Módulos backend — fase 2

## Estructura objetivo en `apps/api/src/modules`
- `skills`
- `mugiwaras`
- `memory`
- `vault`
- `healthcheck`
- `dashboard`
- `usage`
- `system`
- `git_control`

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
- integrar `/memory` desde frontend mediante loader server-side y componente cliente interactivo
- exponer built-in memory solo como resumen allowlisted, nunca como dump crudo
- exponer Honcho solo como facts resumidos y estado de frescura
- dejar Engram modelado por proyecto en una fase posterior
- no exponer prompts, IDs internos, sesiones, observaciones completas, tokens ni secretos

### `vault`
- exponer `GET /api/v1/vault` como workspace documental read-only allowlisted
- exponer `GET /api/v1/vault/documents/{document_path:path}` para lectura de documentos markdown permitidos
- normalizar paths y rechazar traversal, paths absolutos, symlinks, extensiones no soportadas y documentos fuera de allowlist
- integrar `/vault` desde frontend mediante adapter server-only con fallback saneado visible
- sin escritura en MVP

### `healthcheck`
- exponer `GET /api/v1/healthcheck` como workspace read-only saneado
- resumir `vault-sync`, `project-health`, `backup-health`, `hermes-gateways`, `gateway.<mugiwara-slug>` y `cronjobs` desde catálogo seguro backend-owned
- mantener vocabulario allowlisted de `status`, `severity`, `freshness.state`, source IDs y check IDs en el dominio backend
- normalizar payloads de adapters futuros con registro backend-owned allowlist-only antes de serializar; campos crudos o desconocidos se descartan y los source IDs rechazados no se ecoan
- consumir solo fuentes saneadas y timestamps de frescura
- conectar en Phase 15.3a el primer adapter vivo `vault-sync` desde manifiesto fijo Franky-owned, sin exponer rutas, ramas, remotes, Git output ni campos raw
- conectar en Phase 15.3b el adapter vivo `backup-health` desde manifiesto fijo Franky-owned, sin exponer rutas de archivo, nombres de archivos, paths incluidos, stdout/stderr, tamaños ni campos raw
- conectar en Phase 15.4a el adapter vivo `project-health` desde manifiesto fijo Zoro-owned, consumiendo solo timestamp/result y booleanos `workspace_clean`, `main_branch`, `remote_synced`, sin exponer rama cruda, remotes, diffs, untracked file lists, GitHub counts ni last-verify detail
- producir en Phase 15.4b ese manifiesto mediante `scripts/write-project-health-status.py` con escritura atómica, permisos no públicos y JSON mínimo; Git se consulta solo en el productor operativo, nunca desde el backend Healthcheck
- automatizar el productor desde issue #43 con `mugiwara-project-health-status.timer` y `scripts/install-project-health-status-user-timer.sh`; el runner does not run `git fetch`, no pasa `--output`, y `remote_synced` compares `HEAD` with the local upstream ref
- conectar en Phase 15.5a el adapter vivo `gateway-status` desde manifiesto fijo Franky-owned para `hermes-gateways` y `gateway.<mugiwara-slug>`, consumiendo solo timestamp y estado activo/enum allowlisted, sin ejecutar systemd desde backend ni exponer PIDs, comandos, unit files, journal, entorno, rutas o logs
- producir y automatizar en Phase 15.5b ese manifiesto mediante `scripts/write-gateway-status.py`, `mugiwara-gateway-status.timer` y `scripts/install-gateway-status-user-timer.sh`; el runner only checks allowlisted `hermes-gateway-<slug>.service` active state, escribe JSON mínimo atómico con fsync del directorio padre tras `os.replace`, usa `TimeoutStartSec=30s`, conserva `--output` solo para tests/manual controlado y no pasa alternate output paths ni inspecciona journal output, unit file contents, PIDs, command lines, env values, logs o stdout/stderr
- conectar en Phase 15.6a el adapter vivo `cronjobs` desde manifiesto fijo Franky-owned, consumiendo solo `updated_at`, resultado agregado y campos seguros por job (`last_run_at`, `last_status`, `criticality`), sin exponer nombres de jobs, owner profiles, prompt bodies, comandos, chat IDs, targets, logs ni outputs
- producir y automatizar en Phase 15.6b ese manifiesto mediante `scripts/write-cronjobs-status.py`, `mugiwara-cronjobs-status.timer` y `scripts/install-cronjobs-status-user-timer.sh`; el runner lee allowlisted Hermes profile cron registries, aplica desde Phase 15.7a un límite fijo de 1 MiB por registry antes de parsear JSON, escribe JSON mínimo atómico, y does not serialize job names, owner profiles, prompt bodies, commands, delivery targets, chat IDs, logs, stdout/stderr, raw outputs, host paths, tokens or credentials
- cerrar en Phase 15.8 el bloque real-source hasta 15.7b: readers vivos para `vault-sync`, `backup-health`, `project-health`, `gateway-status` y `cronjobs`; producers/runners para `project-health`, `gateway-status` y `cronjobs-status`; productores `vault-sync-status` y `backup-health-status` quedan como follow-ups operativos separados
- planificar en Phase 18.0 esos follow-ups como bloque dedicado: producer y runner/timer separados por fuente, empezando por `vault-sync-status` y dejando `backup-health-status` en microfases propias por mayor sensibilidad
- producir y automatizar en Phase 18.1/18.2 `vault-sync-status` mediante `scripts/write-vault-sync-status.py`, `mugiwara-vault-sync-status.timer` y `scripts/install-vault-sync-status-user-timer.sh`; el runner runs `npm run write:vault-sync-status` desde el repo fijo cada 20 minutos, usa `TimeoutStartSec=620s`, does not pass `--output`, `--sync-script` or `--timeout-seconds`, y no serializa stdout/stderr, raw output, logs, paths, branches, remotes, tokens, credentials ni `.env` values
- producir en Phase 18.3 `backup-health-status` mediante `scripts/write-backup-health-status.py` y `npm run write:backup-health-status`; no unit/timer in Phase 18.3, no ejecuta backups reales, observa solo el directorio fijo de artefactos locales, valida el último checksum con `sha256sum -c`, serializa solo `status`, `result`, `updated_at`, `last_success_at`, `checksum_present` y `retention_count`, y no serializa archive names, paths, sizes, hashes, Drive targets, stdout/stderr, logs or raw output
- documentar y verificar manifest ownership and freshness thresholds antes de cualquier lectura viva (`docs/healthcheck-source-policy.md`)
- bloquear crecimiento accidental hacia consola host genérica con `npm run verify:healthcheck-source-policy`
- no ejecutar shell, Docker, systemd ni leer logs/salidas crudas del host en esta fase
- representar `stale`/`not_configured`/`unknown` de forma explícita

### `dashboard`
- exponer `GET /api/v1/dashboard` como agregación read-only para la home operativa
- componer solo resúmenes seguros y links allowlisted
- degradar Healthcheck no configurado a warning/stale visible, nunca a sano silencioso

### `usage`
- exponer `GET /api/v1/usage/current` como primera frontera read-only del bloque Usage (#51)
- exponer `GET /api/v1/usage/calendar?range=current_cycle|previous_cycle|7d|30d` como primer read model histórico saneado del bloque Usage
- consumir solo la SQLite saneada allowlisted de Codex usage producida fuera del backend
- serializar snapshot actual, plan, ventana 5h, ciclo semanal Codex, frescura y recomendación sin paths runtime ni raw payload
- serializar calendario por fecha natural en zona `Europe/Madrid`, deltas diarios del ciclo semanal Codex calculados por segmento continuo para no contar resets como consumo, tramos parciales por inicio/reset de ciclo, número de ventanas 5h y pico diario sin prompts, raw payload ni actividad Hermes
- exponer `GET /api/v1/usage/five-hour-windows?limit=8` como read model dedicado de últimas ventanas 5h, agrupado por inicio/reset de ventana normalizado a minuto UTC y limitado a `1..24`
- serializar ventanas 5h solo con inicio, fin, pico %, delta positivo intra-ventana, muestras y estado; sin paths runtime, prompts, raw payload ni actividad Hermes
- exponer `GET /api/v1/usage/hermes-activity?range=7d|30d|current_cycle|previous_cycle` como read model backend-only de actividad Hermes agregada por perfiles allowlisted
- leer perfiles Hermes solo si `MUGIWARA_HERMES_PROFILES_ROOT` está configurado en servidor; abrir cada SQLite de perfil en `mode=ro` y no exponer la ruta del fichero ni el root configurado
- serializar actividad Hermes solo como agregados por perfil/rango: sesiones, mensajes, tool calls, primera/última actividad, perfil dominante e índice bajo/medio/alto; sin prompts, conversaciones, tool payloads, tokens por sesión/conversación, IDs, targets, secretos, headers, cookies ni logs
- degradar DB ausente/ilegible/sin snapshots a `not_configured`/`unknown` visible, nunca a dato sano silencioso
- la UI `/usage` consume la actividad Hermes agregada en 17.4d como correlación orientativa y no como causalidad exacta por perfil

### `system`
- exponer `GET /api/v1/system/metrics` como read model backend-only para métricas de sistema usadas por el header global futuro
- serializar solo RAM usada/total/porcentaje, disco usado/total/porcentaje, uptime en días/horas/minutos, `updated_at` y estado de fuente saneado
- calcular RAM usada como `MemTotal - MemAvailable` cuando se usa `/proc/meminfo`, para no inflar uso por cache/buffers
- medir disco contra el target backend-owned `/`, documentado públicamente como `fastapi-visible-root-filesystem`; no serializar path crudo, mount table ni device names
- leer uptime desde fuente OS allowlisted y devolver solo días/horas/minutos, sin raw `/proc` ni salida de comandos
- degradar por familia (`ram`, `disk`, `uptime`) a `unknown` cuando una fuente falte o venga malformada; no filtrar excepciones, paths, logs, stdout/stderr ni detalles host
- no aceptar input cliente para elegir `path`, `mount`, `device`, `command`, `url`, `method`, `host` o `target`
- no usar shell, `subprocess`, comandos `free`/`df`/`uptime`, Docker, systemd, discovery de filesystem ni consola host genérica
- bloquear la frontera backend con `npm run verify:system-metrics-backend-policy`

### `git_control`
- exponer `GET /api/v1/git/repos` como índice read-only de repositorios Git locales allowlisteados por una backend-owned registry
- exponer `GET /api/v1/git/repos/{repo_id}/status` como estado resumido de un repo allowlisteado
- exponer `GET /api/v1/git/repos/{repo_id}/commits?limit=&cursor=` como historial reciente paginado de commits saneados
- exponer `GET /api/v1/git/repos/{repo_id}/branches` como listado de ramas locales saneadas
- aceptar únicamente `repo_id` lógico desde cliente; nunca paths, URLs, remotes, comandos, refs arbitrarias ni revspecs
- validar `limit` como entero `1..50` y `cursor` como token opaco `offset:<n>`; no resolver revsets, SHA/ref cliente ni rangos arbitrarios
- usar Git solo como lectura host-adjacent acotada para status, commits y ramas locales, con `subprocess.run` en lista de argumentos, `shell=False`, `cwd` fijo, timeout, entorno mínimo, config global/system nula y overrides `core.fsmonitor=false`/`core.hooksPath=/dev/null`
- no ejecutar acciones destructivas ni remotas (`checkout`, `reset`, `commit`, `push`, `pull`, `fetch`, `stash`, `merge`, `rebase`)
- no exponer rutas host, nombres de fichero de status, diffs, remotes privados, stdout/stderr, stack traces ni errores crudos
- commits serializan solo hashes, autor/email saneado, fechas, subject/body acotado y trailers `Mugiwara-Agent`/`Signed-off-by`
- branches serializa solo ramas locales con nombre saneado, `current`, sha y short_sha; no remotes ni refs arbitrarias
- degradar repos ausentes/corruptos/ilegibles a `source_unavailable` con payload saneado
- bloquear la frontera backend con `npm run verify:git-control-backend-policy`

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

Phase 18.1 adds `scripts/write-vault-sync-status.py` and `npm run write:vault-sync-status` outside the backend to produce `/srv/crew-core/runtime/healthcheck/vault-sync-status.json`. The Healthcheck backend contract does not change: it still consumes only the fixed sane manifest and never runs vault sync, shell, Git, systemd or filesystem discovery. There is no unit/timer in Phase 18.1; runner automation remains Phase 18.2.

Phase 18.3 adds `scripts/write-backup-health-status.py` and `npm run write:backup-health-status` outside the backend to produce `/srv/crew-core/runtime/healthcheck/backup-health-status.json`. The producer has no unit/timer in Phase 18.3 and does not run backups; it observes only the fixed local backup artifact directory, validates latest checksum presence with `sha256sum -c`, writes fail-closed `checksum_present`/`retention_count` semantics, and never serializes archive names, paths, sizes, hashes, Drive targets, stdout/stderr, logs or raw output.

Phase 18.4 automates `backup-health-status` with `mugiwara-backup-health-status.timer` and `scripts/install-backup-health-status-user-timer.sh`. The runner runs `npm run write:backup-health-status` from the fixed repo root, uses `TimeoutStartSec=120s`, does not pass `--output` or `--backups-dir`, does not run backups, and keeps the backend contract unchanged: Healthcheck still consumes only the fixed sane manifest and never runs backup jobs, shell, systemd or filesystem discovery.

Phase 18.5 closes the Healthcheck producers block canonically. The `healthcheck` module contract does not change: it consumes fixed safe manifests for `vault-sync`, `backup-health`, `project-health`, `gateway-status` and `cronjobs`, while all producer/timer execution remains outside FastAPI. New Healthcheck sources or wider operational actions must be planned as separate phases and reviewed by Franky + Chopper.

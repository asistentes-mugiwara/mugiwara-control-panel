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
- producir y automatizar en Phase 15.5b ese manifiesto mediante `scripts/write-gateway-status.py`, `mugiwara-gateway-status.timer` y `scripts/install-gateway-status-user-timer.sh`; el runner only checks allowlisted `hermes-gateway-<slug>.service` active state, escribe JSON mínimo atómico, y does not inspect journal output, unit file contents, PIDs, command lines, env values, logs, stdout/stderr or alternate output paths
- conectar en Phase 15.6a el adapter vivo `cronjobs` desde manifiesto fijo Franky-owned, consumiendo solo `updated_at`, resultado agregado y campos seguros por job (`last_run_at`, `last_status`, `criticality`), sin exponer nombres de jobs, owner profiles, prompt bodies, comandos, chat IDs, targets, logs ni outputs
- documentar y verificar manifest ownership and freshness thresholds antes de cualquier lectura viva (`docs/healthcheck-source-policy.md`)
- bloquear crecimiento accidental hacia consola host genérica con `npm run verify:healthcheck-source-policy`
- no ejecutar shell, Docker, systemd ni leer logs/salidas crudas del host en esta fase
- representar `stale`/`not_configured`/`unknown` de forma explícita

### `dashboard`
- exponer `GET /api/v1/dashboard` como agregación read-only para la home operativa
- componer solo resúmenes seguros y links allowlisted
- degradar Healthcheck no configurado a warning/stale visible, nunca a sano silencioso

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

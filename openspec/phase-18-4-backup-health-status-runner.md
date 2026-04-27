# Phase 18.4 — Runner/timer `backup-health-status`

## Objetivo
Automatizar solo el refresco periódico del manifest `/srv/crew-core/runtime/healthcheck/backup-health-status.json` usando un runner user-level pequeño, revisable y fijo.

Phase 18.4 no cambia el producer de Phase 18.3, no toca `vault-sync-status`, no cambia backend Healthcheck y no ejecuta backups reales.

## Decisión operacional
Se elige timer user-level en vez de hook post-backup para mantener el patrón ya usado por `vault-sync-status` y evitar acoplar esta microfase a la operativa externa de backups.

Frecuencia elegida: `OnUnitActiveSec=8h` con `RandomizedDelaySec=10min` y `Persistent=true`.

Razonamiento:
- Los thresholds actuales de `backup-health` son warn 1800 min y fail 4320 min.
- Un refresco cada 8h es muy inferior al warning threshold, no es agresivo y mantiene el manifest fresco aunque no haya hook post-backup disponible.
- El producer solo observa artefactos existentes y no ejecuta la operativa de backup.

## Entregables
- `ops/systemd/user/mugiwara-backup-health-status.service`.
- `ops/systemd/user/mugiwara-backup-health-status.timer`.
- `scripts/install-backup-health-status-user-timer.sh`.
- `npm run verify:backup-health-status-runner`.
- Actualización de docs vivas y guardrail `verify:healthcheck-source-policy`.

## Contrato de la unit
La unit de producción debe ejecutar exactamente:

```ini
WorkingDirectory=/srv/crew-core/projects/mugiwara-control-panel
ExecStart=/usr/bin/env npm run write:backup-health-status
TimeoutStartSec=120s
```

Hardening esperado:
- `Type=oneshot`.
- `NoNewPrivileges=yes`.
- `PrivateTmp=yes`.
- `ProtectSystem=full`.
- `ProtectHome=read-only`.

## Restricciones de seguridad
La unit y el installer:
- no pasan `--output`.
- no pasan `--backups-dir`.
- no ejecutan backups reales.
- no ejecutan `/srv/crew-core/scripts/system-backup.sh`.
- no ejecutan `tar`, `zstd`, Drive upload tooling, `rclone` ni equivalentes.
- no serializan ni documentan nombres reales de backups, archive paths, included paths, tamaños, hashes concretos, destinos Drive, stdout/stderr, logs, raw output, errores crudos, tokens, credenciales, `.env`, prompts, chat IDs o delivery targets.

## TDD / guardrails
`npm run verify:backup-health-status-runner` fija:
- existencia de service/timer/installer.
- `ExecStart=/usr/bin/env npm run write:backup-health-status`.
- `WorkingDirectory=/srv/crew-core/projects/mugiwara-control-panel`.
- ausencia de overrides `--output`, `--backups-dir` en unit/installer activos.
- ausencia de ejecución de backups o tooling de empaquetado/subida.
- `TimeoutStartSec=120s`.
- hardening systemd esperado.
- timer `OnUnitActiveSec=8h`, `RandomizedDelaySec=10min`, `Persistent=true`.
- docs/OpenSpec conservan trazabilidad histórica: no unit/timer in Phase 18.3 y runner/timer en Phase 18.4.

## Verify esperado
- `bash -n scripts/install-backup-health-status-user-timer.sh`.
- `systemd-analyze --user verify ops/systemd/user/mugiwara-backup-health-status.service ops/systemd/user/mugiwara-backup-health-status.timer`.
- `npm run verify:backup-health-status-producer`.
- `npm run verify:backup-health-status-runner`.
- `npm run verify:healthcheck-source-policy`.
- `npm run write:backup-health-status`.
- Installer real si el entorno systemd user está disponible.
- `systemctl --user start mugiwara-backup-health-status.service`.
- `systemctl --user is-active mugiwara-backup-health-status.timer`.
- Validación del manifest real: shape, permisos `0750/0640`, frescura, semántica fail-closed y leakage scan `none`.
- Smoke FastAPI `/api/v1/healthcheck` si el entorno lo permite.
- `git diff --check`.

## Review
Franky + Chopper obligatorios:
- Franky: frecuencia, timeout, unit/timer, installer, rollback, permisos, ejecución real systemd user y garantía de no ejecutar backups.
- Chopper: frontera host/backend, no-leakage en unit/docs/tests, ausencia de rutas/nombres/hashes/logs/raw outputs/secrets y ausencia de flags de override.

## Estado de Phase 18.3
Phase 18.3 queda explícitamente como producer-only: no unit/timer in Phase 18.3. Phase 18.4 añade el runner/timer sin cambiar ese contrato histórico.

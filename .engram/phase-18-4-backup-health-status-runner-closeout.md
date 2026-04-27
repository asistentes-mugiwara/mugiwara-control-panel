# Phase 18.4 — backup-health-status runner closeout

## Objetivo
Cerrar la automatización periódica del manifest `/srv/crew-core/runtime/healthcheck/backup-health-status.json` sin ejecutar backups reales ni ampliar la superficie backend.

## Decisión
Se eligió user-level systemd timer cada 8h (`OnUnitActiveSec=8h`, `Persistent=true`, `RandomizedDelaySec=10min`) en vez de hook post-backup. La frecuencia queda muy por debajo de los thresholds `backup-health` warn 1800 min / fail 4320 min y mantiene el patrón repo-local ya usado en Phase 18.2.

## Implementación
- `ops/systemd/user/mugiwara-backup-health-status.service` ejecuta solo `npm run write:backup-health-status` desde el repo root fijo, con `TimeoutStartSec=120s` y hardening systemd básico.
- `ops/systemd/user/mugiwara-backup-health-status.timer` activa el refresco periódico.
- `scripts/install-backup-health-status-user-timer.sh` instala las units en systemd user, hace daemon-reload y enable/start del timer, sin aceptar rutas arbitrarias.
- `scripts/check-backup-health-status-runner.mjs` y `npm run verify:backup-health-status-runner` fijan el contrato.

## Frontera de seguridad
La unit no pasa `--output`, `--backups-dir` ni rutas alternativas. No ejecuta `/srv/crew-core/scripts/system-backup.sh`, backups reales, `tar`, `zstd`, Drive upload tooling ni `rclone`. La documentación conserva solo rutas contractuales necesarias y no nombres/rutas/hashes/logs/raw outputs de backup.

## Verify ejecutado
- `python3 -m py_compile scripts/write-backup-health-status.py` ✅
- `bash -n scripts/install-backup-health-status-user-timer.sh` ✅
- `systemd-analyze --user verify ops/systemd/user/mugiwara-backup-health-status.service ops/systemd/user/mugiwara-backup-health-status.timer` ✅
- `npm run verify:backup-health-status-producer` ✅
- `npm run verify:backup-health-status-runner` ✅
- `npm run verify:healthcheck-source-policy` ✅
- `npm run write:backup-health-status` ✅ (`status=success`, `checksum_present=true`, `retention_count=4`)
- `scripts/install-backup-health-status-user-timer.sh` ✅
- `systemctl --user start mugiwara-backup-health-status.service` ✅
- `systemctl --user is-active mugiwara-backup-health-status.timer` ✅ (`active`)
- `systemctl --user list-timers --all | grep mugiwara-backup-health-status` ✅ (timer listado con siguiente ejecución en ~8h)
- Manifest real validado: shape allowlisted, dir `0750`, file `0640`, leakage scan `none` ✅
- FastAPI `GET /api/v1/healthcheck` vía `TestClient`: HTTP 200, `meta.sanitized=true`, `backup-health` no degrada por ausencia de manifest ✅
- `git diff --check` ✅

## Review pendiente
PR debe ir a Franky + Chopper. Franky valida unit/timer/frecuencia/timeout/instalación/operación real systemd user/no ejecución de backups. Chopper valida frontera host/backend, no-leakage, permisos y ausencia de overrides.

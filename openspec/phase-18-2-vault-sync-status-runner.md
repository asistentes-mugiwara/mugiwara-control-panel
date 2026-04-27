# Phase 18.2 — Runner/timer `vault-sync-status`

## Objetivo
Automatizar el refresco periódico del manifest seguro `/srv/crew-core/runtime/healthcheck/vault-sync-status.json` sin ampliar el backend Healthcheck ni cambiar el contrato del manifest cerrado en Phase 18.1.

## Alcance
- Añadir `ops/systemd/user/mugiwara-vault-sync-status.service`.
- Añadir `ops/systemd/user/mugiwara-vault-sync-status.timer`.
- Añadir `scripts/install-vault-sync-status-user-timer.sh`.
- Añadir `npm run verify:vault-sync-status-runner` como guardrail estático del runner.
- Actualizar docs vivas y `.engram/` de cierre de microfase.

## Decisiones
- Unit user-level, `Type=oneshot`, `WorkingDirectory=/srv/crew-core/projects/mugiwara-control-panel`.
- `ExecStart=/usr/bin/env npm run write:vault-sync-status`; la unidad no pasa `--output`, `--sync-script`, `--timeout-seconds` ni rutas alternativas.
- Timer cada 20 minutos (`OnUnitActiveSec=20min`) con `OnBootSec=3min`, `RandomizedDelaySec=120s` y `Persistent=true`, coherente con thresholds reader `warn=90min` / `fail=360min`.
- `TimeoutStartSec=620s`, alineado con el timeout interno de 600s del productor.
- Hardening user service: `NoNewPrivileges=yes`, `PrivateTmp=yes`, `ProtectSystem=full`, `ProtectHome=read-only`. No se endurece `/srv` como read-only porque el productor debe ejecutar la fuente operacional fija y escribir el manifest fijo.

## Fuera de alcance
- No tocar `backup-health-status` ni Phase 18.3.
- No modificar el backend Healthcheck salvo regresión clara.
- No cambiar el shape del manifest de Phase 18.1.
- No añadir shell/systemd/Git/logs/discovery en `apps/api/src/modules/healthcheck`.
- No exponer paths, logs, stdout/stderr, raw outputs, tokens, credenciales, `.env`, remotes, ramas crudas, prompts, chat IDs ni detalles internos del host.

## Verify esperado
```bash
python3 -m py_compile scripts/write-vault-sync-status.py apps/api/tests/test_vault_sync_status_manifest_producer.py
npm run verify:vault-sync-status-runner
npm run verify:vault-sync-status-producer
npm run verify:healthcheck-source-policy
systemd-analyze --user verify ops/systemd/user/mugiwara-vault-sync-status.service ops/systemd/user/mugiwara-vault-sync-status.timer
scripts/install-vault-sync-status-user-timer.sh
systemctl --user start mugiwara-vault-sync-status.service
systemctl --user is-active mugiwara-vault-sync-status.timer
npm run write:vault-sync-status
# validar shape/permisos/frescura/leakage del manifest real
# smoke FastAPI /api/v1/healthcheck si el entorno lo permite
git diff --check
git status --short --branch
```

## Review
Franky + Chopper obligatorios: Franky para operación/systemd/timer/rollback y Chopper para no-leakage/permisos/frontera host-backend.

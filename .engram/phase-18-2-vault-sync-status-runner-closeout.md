# Phase 18.2 — vault-sync-status runner closeout

## Decisión
Se añade runner systemd user-level para refrescar periódicamente el manifest `vault-sync-status` cerrado en Phase 18.1. El runner ejecuta únicamente `npm run write:vault-sync-status` desde `/srv/crew-core/projects/mugiwara-control-panel`; no pasa `--output`, `--sync-script`, `--timeout-seconds` ni rutas alternativas.

## Contrato operativo
- Service: `ops/systemd/user/mugiwara-vault-sync-status.service`.
- Timer: `ops/systemd/user/mugiwara-vault-sync-status.timer`.
- Installer: `scripts/install-vault-sync-status-user-timer.sh`.
- Cadencia: cada 20 minutos, con `OnBootSec=3min`, `RandomizedDelaySec=120s` y `Persistent=true`.
- Timeout unit: `TimeoutStartSec=620s`, alineado con timeout interno del productor de 600s.
- Hardening: `NoNewPrivileges=yes`, `PrivateTmp=yes`, `ProtectSystem=full`, `ProtectHome=read-only`.

## Verify
- `python3 -m py_compile scripts/write-vault-sync-status.py apps/api/tests/test_vault_sync_status_manifest_producer.py` → OK.
- `PYTHONPATH=. pytest apps/api/tests/test_vault_sync_status_manifest_producer.py apps/api/tests/test_healthcheck_dashboard_api.py -q` → 52 passed.
- `npm run verify:vault-sync-status-runner` → OK.
- `npm run verify:vault-sync-status-producer` → OK.
- `npm run verify:healthcheck-source-policy` → OK.
- `systemd-analyze --user verify ops/systemd/user/mugiwara-vault-sync-status.service ops/systemd/user/mugiwara-vault-sync-status.timer` → OK.
- `scripts/install-vault-sync-status-user-timer.sh` → instalado y `mugiwara-vault-sync-status.timer` activo.
- `systemctl --user start mugiwara-vault-sync-status.service` → OK.
- Manifest real validado: shape permitido, permisos `0750` dir / `0640` file, freshness < 5 min, leakage scan `none`.
- Smoke FastAPI `GET /api/v1/healthcheck` contra uvicorn local → HTTP 200, `vault-sync` presente, leakage scan `none`.
- `git diff --check` → OK.

## Riesgos / notas
- `ProtectHome=read-only` se conserva porque el vault y el runtime fijo viven bajo `/srv`; si Franky detecta necesidad de escritura en HOME por credenciales o tooling Git, debe pedir ajuste explícito.
- Backup-health queda fuera de alcance hasta Phase 18.3.

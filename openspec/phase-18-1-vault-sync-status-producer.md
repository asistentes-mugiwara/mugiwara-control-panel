# Phase 18.1 — Producer `vault-sync-status`

## Objetivo
Implementar solo el productor operativo de `/srv/crew-core/runtime/healthcheck/vault-sync-status.json` como script fuera del backend. La microfase cabe en una sola PR segura porque no añade runner/timer, no toca `backup-health`, no añade lecturas backend y reutiliza el patrón ya validado de productores Healthcheck.

## Gate crítico de fuente operacional
Fuente segura inspeccionada: `/srv/crew-core/scripts/vault-sync.sh`.

Decisión: el productor puede ejecutar ese script revisado como fuente operacional y consumir únicamente su código de salida. El manifest no serializa stdout, stderr, logs, rutas del vault, rama, remotos, SHAs, diffs, credenciales ni errores crudos.

Si el script no existe o no es ejecutable, el productor escribe `failed` fail-closed. Si el script devuelve error o agota timeout, escribe `failed`. Solo escribe `success` y `last_success_at` cuando el script termina con código `0`.

## Alcance cerrado
- `scripts/write-vault-sync-status.py` escribe el manifest mínimo saneado.
- `npm run write:vault-sync-status` ejecuta el productor con rutas fijas por defecto.
- `npm run verify:vault-sync-status-producer` fija el contrato estático del productor.
- Tests unitarios cubren success, failure, fuente ausente, CLI y no-leakage.
- Docs vivas actualizadas.

## Fuera de alcance confirmado
- no unit/timer in Phase 18.1; runner/timer queda para Phase 18.2.
- No `backup-health-status`; queda para Phase 18.3.
- No cambios backend ni nuevas lecturas Healthcheck.

## Contrato del manifest
Ruta fija por defecto: `/srv/crew-core/runtime/healthcheck/vault-sync-status.json`.

Shape success:
```json
{
  "status": "success",
  "result": "success",
  "updated_at": "2026-04-27T08:15:00Z",
  "last_success_at": "2026-04-27T08:15:00Z"
}
```

Shape degradado:
```json
{
  "status": "failed",
  "result": "failed",
  "updated_at": "2026-04-27T08:20:00Z"
}
```

Permisos:
- directorio padre `0750`.
- fichero manifest `0640`.
- escritura atómica con temp file en el mismo directorio, `fsync`, `os.replace`, `chmod` y `fsync` del directorio padre.

## Verify esperado
- `python3 -m py_compile scripts/write-vault-sync-status.py apps/api/tests/test_vault_sync_status_manifest_producer.py`
- `python3 -m pytest apps/api/tests/test_vault_sync_status_manifest_producer.py -q`
- `npm run verify:healthcheck-source-policy`
- `npm run verify:vault-sync-status-producer`
- `npm run write:vault-sync-status`
- validación local de shape/permisos/no-leakage del manifest real
- smoke Healthcheck si el manifest real queda escrito
- `git diff --check`
- `git status --short --branch`

## Review
Franky + Chopper obligatorios.

- Franky: fuente operacional real, permisos, atomicidad, timeout y futura automatización Phase 18.2.
- Chopper: no-leakage, frontera host/backend, no serialización de datos sensibles.

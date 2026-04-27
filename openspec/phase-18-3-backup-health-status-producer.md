# Phase 18.3 — Producer `backup-health-status`

## Objetivo
Implementar solo el productor operativo de `/srv/crew-core/runtime/healthcheck/backup-health-status.json` como script fuera del backend. La microfase cabe en una PR segura porque no añade runner/timer, no ejecuta backups reales, no toca `vault-sync-status`, no cambia el adapter y reutiliza el patrón de manifests Healthcheck atómicos y saneados.

## Gate crítico de fuente operacional
Fuentes inspeccionadas:
- `/srv/crew-core/scripts/system-backup.sh` como productor real de artefactos locales y checksums.
- `/srv/crew-core/backups` como directorio fijo de artefactos locales producido por esa operativa.

Decisión: Phase 18.3 no ejecuta `/srv/crew-core/scripts/system-backup.sh`. El productor observa solo el directorio fijo de artefactos locales, cuenta archivos de backup con patrón esperado, valida la presencia del checksum del backup más reciente con `sha256sum -c` silenciando stdout/stderr y deriva únicamente semántica agregada.

Esto evita disparar backups desde Healthcheck y evita serializar nombres, rutas, tamaños, hashes, destinos Drive, stdout/stderr, logs o errores crudos.

## Alcance cerrado
- `scripts/write-backup-health-status.py` escribe el manifest mínimo saneado.
- `npm run write:backup-health-status` ejecuta el productor con rutas fijas por defecto.
- `npm run verify:backup-health-status-producer` fija el contrato estático del productor.
- Tests unitarios cubren success, checksum ausente/inválido, retención insuficiente, fuente ausente/vacía, CLI, shape y no-leakage.
- Docs vivas actualizadas.

## Fuera de alcance confirmado
- no unit/timer in Phase 18.3; runner/timer queda para Phase 18.4.
- No ejecución de backups reales desde el productor.
- No `mugiwara-backup-health-status.service` ni `mugiwara-backup-health-status.timer`.
- No cambios backend Healthcheck ni contrato del `BackupHealthManifestAdapter`.
- No `vault-sync-status`.

## Contrato del manifest
Ruta fija por defecto: `/srv/crew-core/runtime/healthcheck/backup-health-status.json`.

Shape success:
```json
{
  "status": "success",
  "result": "success",
  "updated_at": "2026-04-27T09:15:00Z",
  "last_success_at": "2026-04-27T07:00:00Z",
  "checksum_present": true,
  "retention_count": 4
}
```

Shape degradado:
```json
{
  "status": "warning",
  "result": "warning",
  "updated_at": "2026-04-27T09:20:00Z",
  "checksum_present": false,
  "retention_count": 4
}
```

Permisos:
- directorio padre `0750`.
- fichero manifest `0640`.
- escritura atómica con temp file en el mismo directorio, `fsync`, `os.replace`, `chmod` y `fsync` del directorio padre.

## Semántica fail-closed
`success` solo se escribe si:
- existe al menos un backup local con patrón esperado;
- el backup más reciente tiene checksum presente y válido;
- `retention_count >= 4`.

Cualquier ausencia de fuente, directorio vacío, checksum ausente/inválido, retención insuficiente o error de lectura degrada a `failed`/`warning` y no incluye `last_success_at`. El adapter seguirá aplicando thresholds backend-owned de frescura sobre `last_success_at` cuando exista.

## Verify esperado
- `python3 -m py_compile scripts/write-backup-health-status.py apps/api/tests/test_backup_health_status_manifest_producer.py`
- `PYTHONPATH=. pytest apps/api/tests/test_backup_health_status_manifest_producer.py -q`
- smoke del adapter `backup-health` si el entorno lo permite
- `npm run verify:backup-health-status-producer`
- `npm run verify:healthcheck-source-policy`
- `npm run write:backup-health-status`
- validación local de shape/permisos/frescura/fail-closed/no-leakage del manifest real
- smoke Healthcheck si el manifest real queda escrito
- `git diff --check`
- `git status --short --branch`

## Review
Franky + Chopper obligatorios.

- Franky: contrato operativo del backup, fuente usada, retención, checksum, atomicidad, permisos y futura automatización Phase 18.4.
- Chopper: no-leakage, ausencia de rutas/nombres/hashes/logs, frontera host/backend, permisos y ausencia de raw outputs/secrets.

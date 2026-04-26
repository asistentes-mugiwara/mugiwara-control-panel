# Phase 18 — Healthcheck producers roadmap

## Objetivo
Reubicar y definir el bloque operativo pendiente de Healthcheck para crear productores/manifest writers seguros de `vault-sync-status.json` y `backup-health-status.json`, sin competir con la numeración ya consumida por Phase 17 Usage.

## Decisión de numeración
- Phase 17.x queda reservada a Usage / GitHub #51 porque PR #69 ya mergeó `phase-17-0-usage-plan` y `phase-17-1` backend foundation.
- El plan verbal anterior que usaba Phase 17.x para productores Healthcheck queda corregido.
- Los productores Healthcheck pendientes pasan a Phase 18.x.

## Estado real actual
Ya existen readers/adapters backend para:
- `vault-sync` leyendo manifiesto fijo esperado en `/srv/crew-core/runtime/healthcheck/vault-sync-status.json`.
- `backup-health` leyendo manifiesto fijo esperado en `/srv/crew-core/runtime/healthcheck/backup-health-status.json`.

Siguen pendientes productores/runners para:
- `vault-sync-status.json`.
- `backup-health-status.json`.

## Principios operativos
- Productores fuera del backend; el backend sigue sin ejecutar shell/Git/systemd ni navegar filesystem.
- JSON mínimo, saneado y estable.
- Escritura atómica: temp file mismo directorio, fsync, `os.replace`, fsync del directorio padre.
- Permisos no públicos: directorio 0750, fichero 0640 salvo decisión operativa distinta de Franky.
- No serializar paths internos innecesarios, remotes, stdout/stderr, logs, diffs, tokens, `.env`, nombres de archivos de backup, checksums concretos ni raw errors.
- Review Franky + Chopper en cada microfase con runtime/host boundary.

## Roadmap canónico

### Phase 18.0 — Planning/reconciliation del bloque operativo Healthcheck
Objetivo: cerrar contrato exacto de producers antes de implementar.

Incluye:
- Confirmar estado actual de readers y rutas fijas esperadas.
- Definir schema mínimo por manifiesto.
- Definir reviewers y verify por subfase.
- Crear checklist y closeout de continuidad.

Verify:
- `git diff --check`.
- Revisión documental de docs/read-models/api-modules/healthcheck-source-policy.

### Phase 18.1 — Producer `vault-sync-status`
Objetivo: crear `scripts/write-vault-sync-status.py` y script npm `write:vault-sync-status`.

JSON mínimo recomendado:
- `status`
- `result`
- `updated_at`
- `last_success_at` si está disponible de forma segura.

No serializar:
- branch, remotes, stdout/stderr, logs, rutas internas, tokens, diffs, errores crudos.

Verify mínimo:
- `python3 -m py_compile scripts/write-vault-sync-status.py ...tests...`
- pytest dirigido del productor.
- `npm run verify:healthcheck-source-policy`.
- nuevo `npm run verify:vault-sync-status-runner` o guardrail equivalente.
- `npm run write:vault-sync-status`.
- validar shape/permisos del manifiesto real.
- smoke API Healthcheck contra el manifiesto real.
- `git diff --check`.

Review: Franky + Chopper.

### Phase 18.2 — Runner/timer `vault-sync-status`
Objetivo: automatizar refresco periódico del manifiesto.

Incluye:
- `mugiwara-vault-sync-status.service`.
- `mugiwara-vault-sync-status.timer`.
- `scripts/install-vault-sync-status-user-timer.sh`.
- Timer coherente con thresholds actuales `vault-sync`: warn 90m / fail 360m. Refresco inicial recomendado: 15–30 min salvo ajuste de Franky.
- `TimeoutStartSec`, `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem`, `ProtectHome` cuando encajen.
- Unit llama script npm fijo, sin `--output` alternativo.

Verify mínimo:
- `systemd-analyze --user verify ...service ...timer`.
- ejecutar installer.
- `systemctl --user start mugiwara-vault-sync-status.service`.
- `systemctl --user is-active mugiwara-vault-sync-status.timer`.
- validar manifiesto real.
- guardrail runner.
- smoke API Healthcheck.

Review: Franky + Chopper.

### Phase 18.3 — Producer `backup-health-status`
Objetivo: crear productor seguro de backup health.

JSON mínimo recomendado:
- `status`
- `result`
- `updated_at`
- `last_success_at`
- `checksum_present`
- `retention_count`

Semántica fail-closed:
- `pass` solo si hay resultado positivo explícito.
- `checksum_present is True`.
- `retention_count >= 4` salvo cambio explícito de política.
- Ausencia/parcialidad/desconocido degrada a `warn/stale/unknown`, nunca a verde silencioso.

No serializar:
- rutas de archivo, nombres de backups, destinos, tamaños, checksums concretos, stdout/stderr, logs, raw output, tokens o errores crudos.

Verify mínimo:
- py_compile + pytest dirigido.
- guardrail runner específico.
- ejecución real `npm run write:backup-health-status`.
- validar shape/permisos del manifiesto real.
- smoke API Healthcheck.
- `git diff --check`.

Review: Franky + Chopper.

### Phase 18.4 — Runner/timer `backup-health-status`
Objetivo: automatizar refresco periódico del manifiesto backup.

Incluye:
- `mugiwara-backup-health-status.service`.
- `mugiwara-backup-health-status.timer`.
- installer seguro.
- Timer coherente con thresholds actuales `backup-health`: warn 1800m / fail 4320m; frecuencia no agresiva, ajustada a la cadencia real de backups.

Verify mínimo:
- systemd analyze + installer + start service + timer active.
- validar manifiesto real y permisos.
- smoke API Healthcheck.

Review: Franky + Chopper.

### Phase 18.5 — Closeout/canon Healthcheck producers
Objetivo: cerrar el bloque productores pendientes.

Incluye:
- Actualizar docs vivas (`healthcheck-source-policy`, `api-modules`, `read-models`).
- Actualizar Project Summary del vault.
- Closeout Engram.
- Confirmar que `vault-sync` y `backup-health` ya no degradan por falta de manifiesto si los productores están activos.

Verify:
- Guardrails Healthcheck relevantes.
- Smoke API Healthcheck.
- `git diff --check`.

## Roadmap paralelo no mezclable
- Phase 17.x Usage sigue abierta hasta UI `/usage`, calendario, ventanas 5h históricas y actividad Hermes agregada.
- Phase 18.x Healthcheck producers puede ejecutarse antes o después de 17.2, pero no debe mezclarse en la misma PR.
- #40 Git control y #36 header metrics quedan después, salvo decisión explícita de Pablo.

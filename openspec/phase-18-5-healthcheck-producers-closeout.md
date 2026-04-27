# Phase 18.5 — Healthcheck producers closeout/canon

## Objetivo
Cerrar canónicamente el bloque Phase 18 Healthcheck producers después de PR #78–#82, sin añadir nuevos productores, runners, backend, UI ni cambios de runtime.

## Estado cerrado
- Phase 18.0 / PR #78: planificación y reconciliación del bloque.
- Phase 18.1 / PR #79: productor `vault-sync-status`.
- Phase 18.2 / PR #80: runner/timer user-level `vault-sync-status` activo cada 20 minutos.
- Phase 18.3 / PR #81: productor `backup-health-status`.
- Phase 18.4 / PR #82: runner/timer user-level `backup-health-status` activo cada 8 horas.

## Canon final Healthcheck producers
Todos los manifests Healthcheck planificados para el bloque tienen reader fijo y productor/timer operativo fuera del backend:

| Fuente | Manifest | Productor | Runner/timer | Frecuencia |
| --- | --- | --- | --- | --- |
| `vault-sync` | `/srv/crew-core/runtime/healthcheck/vault-sync-status.json` | `npm run write:vault-sync-status` | `mugiwara-vault-sync-status.timer` | 20 min |
| `backup-health` | `/srv/crew-core/runtime/healthcheck/backup-health-status.json` | `npm run write:backup-health-status` | `mugiwara-backup-health-status.timer` | 8 h |
| `project-health` | `/srv/crew-core/runtime/healthcheck/project-health-status.json` | `npm run write:project-health-status` | `mugiwara-project-health-status.timer` | 15 min |
| `gateway-status` | `/srv/crew-core/runtime/healthcheck/gateway-status.json` | `npm run write:gateway-status` | `mugiwara-gateway-status.timer` | 2 min |
| `cronjobs-status` | `/srv/crew-core/runtime/healthcheck/cronjobs-status.json` | `npm run write:cronjobs-status` | `mugiwara-cronjobs-status.timer` | 5 min |

## Frontera de seguridad preservada
- FastAPI Healthcheck solo consume manifests fijos saneados.
- Los productores viven fuera del backend.
- Los runners systemd user-level ejecutan scripts npm fijos desde el repo.
- No hay consola host genérica, shell remoto, discovery de filesystem, lectura de logs/stdout/stderr ni ejecución de backups desde el backend.
- Los manifests mantienen shape mínimo, permisos no públicos y no-leakage.
- `backup-health-status` no ejecuta backups reales ni tooling de compresión/subida.

## Fuera de alcance
- Nuevas fuentes Healthcheck.
- Cambios backend/API/read-model.
- Cambios frontend/UI.
- Issues #40 y #36.
- Phase 17 Usage.
- Cualquier cambio en operativa real de backup, Drive o vault sync.

## Verify esperado
- `npm run verify:healthcheck-source-policy`.
- `npm run verify:vault-sync-status-producer`.
- `npm run verify:vault-sync-status-runner`.
- `npm run verify:backup-health-status-producer`.
- `npm run verify:backup-health-status-runner`.
- `npm run verify:project-health-runner`.
- `npm run verify:gateway-status-runner`.
- `npm run verify:cronjobs-status-runner`.
- `systemctl --user is-active` para los cinco timers.
- Validación shape/permisos de los cinco manifests reales.
- Smoke FastAPI `/api/v1/healthcheck`.
- `git diff --check`.

## Decisión de review
El cambio de Phase 18.5 es docs/canon/closeout: no modifica runtime, scripts ejecutables, backend, UI, dependencias, permisos ni units. Si el diff se mantiene estrictamente documental, Zoro puede usar excepción de bajo riesgo con PR corta y revisión manual propia. Si durante la fase aparece cualquier cambio operativo o de seguridad efectivo, debe pedir Franky + Chopper.

## Resultado esperado
- Docs vivas alineadas con el estado real de PR #78–#82.
- `.engram` registra cierre del bloque.
- Project Summary del vault deja Phase 18 como cerrado y recomienda #40/#36 como siguientes features separadas.

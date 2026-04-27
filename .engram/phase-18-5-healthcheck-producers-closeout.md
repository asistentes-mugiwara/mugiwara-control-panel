# Phase 18.5 — Healthcheck producers closeout

## Objetivo
Cerrar el bloque Phase 18 Healthcheck producers como docs/canon-only, sin cambios de runtime, backend, UI, dependencias ni systemd units.

## Estado canónico
PR #78–#82 cerraron el bloque completo:
- 18.0 planificación/reconciliación.
- 18.1 `vault-sync-status` producer.
- 18.2 `vault-sync-status` runner/timer activo.
- 18.3 `backup-health-status` producer.
- 18.4 `backup-health-status` runner/timer activo.

## Decisión
Phase 18.5 solo actualiza docs vivas, OpenSpec, `.engram` y Project Summary del vault. Como no cambia runtime efectivo ni seguridad, puede cerrarse por PR corta con revisión manual de Zoro si verify confirma que el diff es documental.

## Verify ejecutado
- `npm run verify:healthcheck-source-policy` ✅
- `npm run verify:vault-sync-status-producer` ✅
- `npm run verify:vault-sync-status-runner` ✅
- `npm run verify:backup-health-status-producer` ✅
- `npm run verify:backup-health-status-runner` ✅
- `npm run verify:project-health-runner` ✅
- `npm run verify:gateway-status-runner` ✅
- `npm run verify:cronjobs-status-runner` ✅
- `systemctl --user is-active` para los cinco timers ✅ (`active` todos)
- Cinco manifests reales validados con shape mínimo, dir `0750`, file `0640`, leakage scan `none` ✅
- FastAPI smoke `/api/v1/healthcheck`: HTTP 200, `meta.sanitized=true`, sin `not_configured` en smoke live ✅
- `git diff --check` ✅

## Siguiente paso
Después del merge y vault sync, no continuar con nuevas features sin nueva instrucción. El roadmap queda en #40 Git control page y #36 always-visible header metrics como features separadas.

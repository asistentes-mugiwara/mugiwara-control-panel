# Phase 18.5 — closeout verify checklist

## Repo/Git
- [x] `main` actualizado desde `origin/main` antes de crear rama.
- [x] Rama `zoro/phase-18-5-healthcheck-producers-closeout`.
- [x] PR #78–#82 mergeadas.
- [x] Issues abiertas confirmadas: #40 y #36.

## Canon/docs
- [x] `docs/healthcheck-source-policy.md` marca Phase 18.5 como cierre del bloque.
- [x] `docs/read-models.md` marca producer+runner coverage completa para Healthcheck manifests.
- [x] `docs/api-modules.md` mantiene frontera FastAPI sin ejecución host.
- [x] `openspec/phase-18-5-healthcheck-producers-closeout.md` creado.
- [x] `.engram/phase-18-5-healthcheck-producers-closeout.md` creado.
- [ ] Project Summary del vault actualizado tras merge.

## Runtime observado
- [x] `mugiwara-vault-sync-status.timer` activo.
- [x] `mugiwara-backup-health-status.timer` activo.
- [x] `mugiwara-project-health-status.timer` activo.
- [x] `mugiwara-gateway-status.timer` activo.
- [x] `mugiwara-cronjobs-status.timer` activo.
- [x] Cinco manifests reales existen con dir `0750` y file `0640`.

## Verify
- [x] `npm run verify:healthcheck-source-policy`.
- [x] `npm run verify:vault-sync-status-producer`.
- [x] `npm run verify:vault-sync-status-runner`.
- [x] `npm run verify:backup-health-status-producer`.
- [x] `npm run verify:backup-health-status-runner`.
- [x] `npm run verify:project-health-runner`.
- [x] `npm run verify:gateway-status-runner`.
- [x] `npm run verify:cronjobs-status-runner`.
- [x] FastAPI smoke `/api/v1/healthcheck` HTTP 200 y `meta.sanitized=true`.
- [x] `git diff --check`.
- [x] `git status --short --branch`.

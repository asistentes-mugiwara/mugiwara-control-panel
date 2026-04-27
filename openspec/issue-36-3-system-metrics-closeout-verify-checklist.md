# Issue #36.3 — Verify checklist

## Preparación
- [x] `main` actualizado antes de crear rama.
- [x] Rama `zoro/issue-36-3-system-metrics-closeout`.
- [x] Issue #36, PR #85, PR #86 y OpenSpec 36.0 revisados.

## Guardrails/canon
- [x] `npm run verify:system-metrics-server-only`.
- [x] `npm run verify:system-metrics-backend-policy`.
- [x] `npm run verify:perimeter-policy`.
- [x] `npm run verify:healthcheck-source-policy`.

## Frontend/backend verify
- [x] `npm --prefix apps/web run typecheck`.
- [x] `npm --prefix apps/web run build`.
- [x] `npm run verify:visual-baseline`.
- [x] `PYTHONPATH=. pytest apps/api/tests/test_system_metrics_api.py apps/api/tests/test_perimeter_api.py -q`.

## Smoke anti-fugas
- [x] Smoke live `/dashboard` sin backend URL/env pública/raw errors.
- [x] Smoke env inválida sin URL interna ni stack traces.
- [x] Browser/DOM smoke con consola limpia y sin overflow horizontal.

## Cierre
- [x] `git diff --check`.
- [ ] PR abierta y revisada por Chopper + Usopp.
- [ ] PR mergeada.
- [ ] Project Summary del vault actualizado y pusheado.
- [ ] Engram actualizado.
- [ ] Issue #36 comentada y cerrada.

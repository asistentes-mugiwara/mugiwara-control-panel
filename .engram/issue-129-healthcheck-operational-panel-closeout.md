# Issue #129 — Healthcheck operational panel closeout

## Resultado técnico
- Backend: `GET /api/v1/healthcheck` ya no conserva un `HealthcheckService` global creado en import time; cada request construye servicio nuevo y relee fuentes fijas.
- Contrato: `healthcheck.workspace.data.operational_checks[]` fija seis checks saneados (`gateways`, `honcho`, `docker_runtime`, `cronjobs`, `vault_sync`, `backup`).
- Frontend: `/healthcheck` pasa a panel operativo con seis cards, estado agregado y prioridad actual; se retira la bitácora/historial visible.
- Seguridad: Honcho y Docker quedan como estados `unknown` si no hay manifiesto saneado y no exponen datos internos, datos internos, PIDs, rutas, comandos ni logs.

## Verify ejecutado
- `PYTHONPATH=. pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` — 50 passed.
- `npm run verify:healthcheck-review-clarity` — passed.
- `npm --prefix apps/web run typecheck` — passed.

## Pendiente antes de merge
- Build web y smoke API/HTML/DOM.
- PR con reviews Franky + Chopper + Usopp; no mergear sin revisión.

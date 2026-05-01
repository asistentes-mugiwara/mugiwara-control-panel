# Issue #129 — Healthcheck operational panel

## Objetivo
Replantear `/healthcheck` como panel operativo vivo, simple y seguro.

## Scope
- Backend Healthcheck sin snapshots stale: el router crea `HealthcheckService()` por request para releer manifiestos fijos actuales.
- Contrato saneado `operational_checks[]` con exactamente seis checks UI: `gateways`, `honcho`, `docker_runtime`, `cronjobs`, `vault_sync`, `backup`.
- Frontend `/healthcheck` como seis cards simples mobile-first, sin historial ni bitácora visible.
- Guardrails de no exposición para logs, rutas, comandos, PIDs, env vars, IDs Docker, mounts, remotes internos y datos Honcho.

## Fuera de alcance
- Ejecutar Docker, systemd, shell o Honcho desde backend.
- Exponer registros internos de Honcho o detalles de contenedores Docker.
- Añadir historial, eventos, bitácora o timeline visual.
- Merge sin reviews de Franky, Chopper y Usopp.

## Diseño
- Se conserva `modules[]`/`events[]` como compatibilidad legacy, pero la UI usa `operational_checks[]`.
- Los checks `honcho` y `docker_runtime` degradan a `unknown` si no hay manifiesto saneado, con copy seguro y sin datos internos.
- `gateways` agrega la peor señal entre `hermes-gateways` y `gateway.<slug>`.
- `cronjobs`, `vault_sync` y `backup` derivan de fuentes allowlisted ya existentes.

## Verificación esperada
- `PYTHONPATH=. pytest apps/api/tests/test_healthcheck_dashboard_api.py -q`
- `npm run verify:healthcheck-review-clarity`
- `npm run verify:health-dashboard-server-only`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- Smoke API/HTML/DOM confirmando `operational_checks`, seis cards y ausencia de `Bitácora histórica`.

## Review routing
- Franky: fuentes reales, thresholds, allowlists, live-per-request.
- Chopper: no exposición Docker/Honcho/links/datos host.
- Usopp: claridad UI/UX responsive mobile-first.

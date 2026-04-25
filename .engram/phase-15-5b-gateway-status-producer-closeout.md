# Phase 15.5b closeout — Gateway status producer

## Resumen
Phase 15.5b añade el productor operativo para el manifiesto `gateway-status` consumido por el adapter de Phase 15.5a. El backend sigue sin ejecutar systemd: el productor vive en `scripts/write-gateway-status.py`, el runner en unidades user-level bajo `ops/systemd/user/`, y la instalación en `scripts/install-gateway-status-user-timer.sh`.

## Contrato de seguridad
- Output fijo: `/srv/crew-core/runtime/healthcheck/gateway-status.json`.
- JSON mínimo: `status`, `result`, `updated_at`, `gateways.<slug>.active`.
- Consulta permitida: `systemctl --user is-active hermes-gateway-<slug>.service` para slugs allowlisted.
- Prohibido: journal, unit file contents, PIDs, command lines, env values, logs, stdout/stderr, rutas runtime detalladas y alternate output paths en la unidad.

## Continuidad
- Mantener `verify:gateway-status-runner` cuando cambien productor/unidades/docs.
- Review requerida: Franky + Chopper por runtime systemd y frontera host/security.
- Cronjobs siguen fuera del bloque; siguiente microfase natural: fuente/manifest global de cronjobs saneada.

# Phase 15.5a — Gateway status manifest adapter

## Objetivo
Conectar la lectura Healthcheck de `hermes-gateways` y `gateway.<mugiwara-slug>` mediante un adapter backend seguro que consume un manifiesto fijo Franky-owned, sin ejecutar systemd ni leer logs/salidas crudas desde el backend.

## Alcance
- Añadir `GatewayStatusManifestAdapter` en `apps/api/src/modules/healthcheck/source_adapters.py`.
- Leer únicamente el manifiesto fijo `/srv/crew-core/runtime/healthcheck/gateway-status.json`.
- Emitir un snapshot agregado `hermes-gateways` y un snapshot por cada slug allowlisted en `MUGIWARA_GATEWAY_SOURCE_IDS`.
- Consumir solo semántica mínima: `updated_at`/`last_success_at`, `gateways.<slug>.active` y `status|result` allowlisted.
- Degradar manifiesto ausente, ilegible, parcial, stale o con gateways inactivos a estados visibles (`not_configured`, `unknown`, `warn`, `stale`, `fail`).
- Enrutar todo por `HealthcheckSourceRegistry` para conservar label backend-owned y saneado textual final.
- Integrar el adapter en el conjunto por defecto de `HealthcheckService`.
- Actualizar docs vivas y guardrail `verify:healthcheck-source-policy`.

## Fuera de alcance
- Ejecutar `systemctl`, `systemd`, shell, subprocess, Docker o cualquier comando desde el backend Healthcheck.
- Leer unit files, journal, PIDs, command lines, entorno, runtime paths, restart logs o stdout/stderr.
- Crear el productor/runner real del manifiesto gateway; queda para una 15.5b operativa con Franky.
- Añadir lecturas de cronjobs.
- Añadir GitHub issue/PR counts o last-verify aggregation.
- Cambiar UI específica de Healthcheck.

## Decisiones técnicas
- El backend sigue sin consultar systemd en request path: 15.5a es solo reader de manifiesto seguro.
- La cobertura per-gateway es fija y backend-owned; no se aceptan slugs desde cliente ni discovery dinámico.
- `pass` per-gateway requiere `active: true` o resultado positivo explícito y timestamp fresco.
- Gateway inactivo explícito degrada a `fail`; entradas ausentes/parciales degradan a `not_configured`; manifiesto ilegible a `unknown`.
- El estado global deriva de los per-gateway allowlisted: `fail` domina, stale por timestamp domina sobre cobertura parcial, `pass` solo si todos los gateways están en verde y frescos.

## Verify esperado
```bash
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
python -m py_compile apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py
npm run verify:healthcheck-source-policy
npm run verify:perimeter-policy
git diff --check
```

## Review requerido
Franky + Chopper.

- Franky: contrato operativo del manifiesto gateway, semántica agregado/per-gateway, thresholds y futura automatización systemd.
- Chopper: frontera host/no systemd en backend, ausencia de leakage de PIDs/unit/journal/env/paths/logs y degradación segura.

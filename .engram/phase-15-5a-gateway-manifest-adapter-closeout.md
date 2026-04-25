# Phase 15.5a closeout — Gateway status manifest adapter

## Qué queda hecho
- Se añadió `GatewayStatusManifestAdapter` como reader fijo para `/srv/crew-core/runtime/healthcheck/gateway-status.json`.
- El adapter emite `hermes-gateways` y todos los `gateway.<mugiwara-slug>` allowlisted desde `MUGIWARA_GATEWAY_SOURCE_IDS`.
- HealthcheckService incorpora los snapshots gateway por defecto junto a vault-sync, backup-health y project-health.
- Tests cubren success fresco, gateway inactivo, manifiesto parcial, ausente, ilegible y stale con scan recursivo anti leakage.
- Docs y guardrail `verify:healthcheck-source-policy` se actualizaron para fijar la nueva frontera.

## Decisiones
- 15.5a no ejecuta systemd ni añade productor. El backend solo consume un manifiesto seguro Franky-owned.
- El productor/runner gateway queda para una microfase posterior, probablemente 15.5b, con Franky como reviewer operativo principal y Chopper por frontera host.
- El estado global deriva de las entradas per-gateway allowlisted; no hay discovery dinámico de servicios ni slugs desde input cliente.

## Riesgos/follow-ups
- Hasta que exista productor real, el estado por defecto puede degradar todos los gateways a `not_configured` si el manifiesto no existe.
- Hace falta definir/implementar el productor atómico de `/srv/crew-core/runtime/healthcheck/gateway-status.json` sin exponer PIDs, unit content, journal, command lines, env ni paths.

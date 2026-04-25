# Phase 15.5b — Gateway status manifest producer

## Objetivo
Crear el productor operativo Franky-owned del manifiesto `gateway-status` consumido por Phase 15.5a, manteniendo el backend Healthcheck sin systemd, sin consola host y sin leakage de detalles runtime.

## Alcance
- Añadir `scripts/write-gateway-status.py` como productor fuera del backend.
- Consultar únicamente `systemctl --user is-active hermes-gateway-<slug>.service` para slugs Mugiwara allowlisted.
- Escribir `/srv/crew-core/runtime/healthcheck/gateway-status.json` de forma atómica.
- Serializar solo `status`, `result`, `updated_at` y `gateways.<slug>.active`.
- Crear unidades user-level `mugiwara-gateway-status.service` y `mugiwara-gateway-status.timer`.
- Añadir instalador `scripts/install-gateway-status-user-timer.sh`.
- Añadir guardrail `verify:gateway-status-runner`.
- Actualizar docs vivas de Healthcheck.

## Fuera de alcance
- Ejecutar systemd desde `apps/api/src/modules/healthcheck`.
- Leer `journalctl`, `systemctl show/cat/status`, unit files, PIDs, command lines, env values, logs, stdout/stderr o rutas runtime detalladas.
- Exponer nombres de unidades en el manifiesto público.
- Añadir cronjobs, GitHub issue/PR counts o last-verify aggregation.
- Añadir UI nueva.

## Decisiones técnicas
- El productor usa allowlist interna `MUGIWARA_GATEWAY_SLUGS` alineada con `gateway.<mugiwara-slug>`.
- `pass` posterior en backend depende de timestamp fresco y `active: true`; el productor solo emite booleanos mínimos.
- `status/result = success` solo si todos los gateways allowlisted están activos; si alguno no lo está, `failed`.
- La unidad systemd no acepta overrides `--output`; el output fijo evita desvíos de ruta.
- Timer inicial: `OnBootSec=1min`, `OnUnitActiveSec=2min`, `RandomizedDelaySec=15s`, `Persistent=true`.

## Verify esperado
```bash
PYTHONPATH=. python -m pytest apps/api/tests/test_gateway_status_manifest_producer.py -q
python -m py_compile scripts/write-gateway-status.py apps/api/tests/test_gateway_status_manifest_producer.py
npm run verify:gateway-status-runner
npm run verify:healthcheck-source-policy
npm run verify:perimeter-policy
npm run write:gateway-status
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
python -m py_compile apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py
systemd-analyze --user verify ops/systemd/user/mugiwara-gateway-status.service ops/systemd/user/mugiwara-gateway-status.timer
scripts/install-gateway-status-user-timer.sh
systemctl --user start mugiwara-gateway-status.service
systemctl --user is-active mugiwara-gateway-status.timer
python - <<'PY'
import json
from pathlib import Path
p = Path('/srv/crew-core/runtime/healthcheck/gateway-status.json')
data = json.loads(p.read_text())
assert set(data) == {'status', 'result', 'updated_at', 'gateways'}
assert all(set(v) == {'active'} for v in data['gateways'].values())
PY
git diff --check
```

## Review requerido
Franky + Chopper.

- Franky: semántica operativa del productor, timer 1–5 min, atomicidad, permisos, unidades user-level y contrato systemd mínimo.
- Chopper: no leakage de host/runtime, no consola systemd genérica, output fijo y frontera backend intacta.

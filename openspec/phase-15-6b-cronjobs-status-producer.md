# Phase 15.6b — Cronjobs status manifest producer

## Objetivo
Crear el productor operativo Franky-owned del manifiesto `cronjobs-status` consumido por Phase 15.6a, manteniendo el backend Healthcheck sin runtime cron directo, sin consola host y sin leakage de nombres de jobs, prompts, comandos, targets o logs.

## Alcance
- Añadir `scripts/write-cronjobs-status.py` como productor fuera del backend.
- Leer únicamente registros cron de perfiles Hermes allowlisted desde `~/.hermes/profiles/<profile>/cron/jobs.json`.
- Escribir `/srv/crew-core/runtime/healthcheck/cronjobs-status.json` de forma atómica.
- Serializar solo:
  - `status` / `result`
  - `updated_at`
  - `jobs[].last_run_at`
  - `jobs[].last_status`
  - `jobs[].criticality`
- Filtrar a jobs recurrentes habilitados; excluir one-shots futuros y jobs normales que aún no han ejecutado nunca para no convertir tareas programadas puntuales o recién creadas en deuda Healthcheck permanente.
- Crear unidades user-level `mugiwara-cronjobs-status.service` y `mugiwara-cronjobs-status.timer`.
- Añadir instalador `scripts/install-cronjobs-status-user-timer.sh`.
- Añadir guardrail `verify:cronjobs-status-runner`.
- Actualizar docs vivas de Healthcheck.

## Fuera de alcance
- Ejecutar `cronjob list` desde el backend o desde el productor como fuente profile-local.
- Exponer nombres de jobs, owner profiles, prompts, comandos, chat IDs, delivery targets, stdout/stderr, logs, raw outputs, rutas host, tokens o credenciales.
- Añadir UI nueva o cambiar layout de `/healthcheck`.
- Añadir GitHub issue/PR counts o last-verify aggregation.
- Resolver monitorización semántica específica de cada job más allá de último run/status/criticality.

## Decisiones técnicas
- El productor usa allowlist interna de perfiles cron (`luffy`, `franky`, `usopp`, `sanji`) porque son los perfiles con registros cron activos o esperados hoy.
- `criticality='critical'` queda restringido al cron operativo frecuente `vault-sync`; jobs diarios o de cadencia mayor quedan como `normal` porque su frescura se valida por fuentes Healthcheck dedicadas o por follow-ups específicos.
- `last_status` se normaliza a `success`, `failed`, `warning` o `unknown`; no se serializa el valor raw.
- `status/result = failed` si hay job crítico fallido; `warning` si hay jobs críticos incompletos/degradados o si no hay jobs; `success` si los jobs recurrentes observados están saneados.
- La unidad systemd no acepta overrides `--output` ni `--profiles-root`; usa rutas fijas revisadas.
- Timer inicial: `OnBootSec=2min`, `OnUnitActiveSec=5min`, `RandomizedDelaySec=30s`, `Persistent=true`, coherente con umbrales Healthcheck 180/720 min.

## Verify esperado
```bash
PYTHONPATH=. python -m pytest apps/api/tests/test_cronjobs_status_manifest_producer.py -q
python -m py_compile scripts/write-cronjobs-status.py apps/api/tests/test_cronjobs_status_manifest_producer.py
npm run verify:cronjobs-status-runner
npm run verify:healthcheck-source-policy
npm run verify:perimeter-policy
npm run write:cronjobs-status
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
PYTHONPATH=. python -m pytest apps/api/tests -q
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
systemd-analyze --user verify ops/systemd/user/mugiwara-cronjobs-status.service ops/systemd/user/mugiwara-cronjobs-status.timer
scripts/install-cronjobs-status-user-timer.sh
systemctl --user start mugiwara-cronjobs-status.service
systemctl --user is-active mugiwara-cronjobs-status.timer
python - <<'PY'
import json
from pathlib import Path
p = Path('/srv/crew-core/runtime/healthcheck/cronjobs-status.json')
data = json.loads(p.read_text())
assert set(data) == {'status', 'result', 'updated_at', 'jobs'}
assert all(set(v) == {'last_run_at', 'last_status', 'criticality'} for v in data['jobs'])
PY
git diff --check
```

## Review requerido
Franky + Chopper.

- Franky: semántica operativa del productor, cadencia 5 min, atomicidad, permisos, unidades user-level y cobertura de cronjobs globales.
- Chopper: no leakage de prompts/comandos/chat/logs/output/paths, no consola cron genérica y frontera backend intacta.

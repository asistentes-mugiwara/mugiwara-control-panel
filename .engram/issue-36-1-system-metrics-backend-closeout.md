# Issue #36.1 system metrics backend — closeout

## Fase
36.1 — Backend read model/API foundation.

## Rama
`zoro/issue-36-1-system-metrics-backend`.

## Resultado
Se implementa el backend read-only para métricas de sistema sin tocar UI ni frontend:

- `GET /api/v1/system/metrics`.
- Módulo `apps/api/src/modules/system`.
- Contrato TypeScript `SystemMetricsResponse`.
- Guardrail `npm run verify:system-metrics-backend-policy`.

## Decisiones técnicas
- RAM usada se calcula como `MemTotal - MemAvailable` desde `/proc/meminfo`, siguiendo review de Franky en 36.0.
- Disco usa `shutil.disk_usage('/')`; el payload público no expone `/`, solo `fastapi-visible-root-filesystem`.
- Uptime se parsea desde `/proc/uptime` y se serializa solo como días/horas/minutos.
- Cada familia (`ram`, `disk`, `uptime`) degrada independientemente a `source_state='unknown'` con valores `null` si falla o viene malformada.
- El envelope usa `status='ready'` si todo está live y `status='source_unavailable'` si alguna familia degrada.
- Querystrings cliente como `path`, `mount`, `device`, `command`, `url`, `method`, `host` o `target` no controlan la fuente ni se ecoan.

## Seguridad
No se serializa:
- paths host crudos;
- mount table;
- device names;
- hostname;
- process list;
- users;
- raw `/proc`;
- stdout/stderr/raw output;
- logs, tracebacks o excepciones;
- tokens, `.env`, credenciales.

El backend no usa shell, `subprocess`, comandos `free`/`df`/`uptime`, Docker, systemd ni discovery de filesystem.

## Archivos relevantes
- `apps/api/src/modules/system/service.py`.
- `apps/api/src/modules/system/router.py`.
- `apps/api/src/modules/system/AGENTS.md`.
- `apps/api/tests/test_system_metrics_api.py`.
- `scripts/check-system-metrics-backend-policy.mjs`.
- `packages/contracts/src/read-models.ts`.
- `docs/api-modules.md`.
- `docs/read-models.md`.
- `docs/security-perimeter.md`.

## Verify
Ejecutado antes de commit/PR:
- `python3 -m py_compile apps/api/src/modules/system/*.py apps/api/tests/test_system_metrics_api.py`.
- `PYTHONPATH=. pytest apps/api/tests/test_system_metrics_api.py -q` — 3 passed.
- `PYTHONPATH=. pytest apps/api/tests/test_perimeter_api.py apps/api/tests/test_healthcheck_dashboard_api.py -q` — 50 passed.
- `npm run verify:system-metrics-backend-policy`.
- `npm run verify:perimeter-policy`.
- `npm run verify:healthcheck-source-policy`.
- `npm --prefix apps/web run typecheck`.
- `git diff --check`.

## Siguiente paso
Pedir review Franky + Chopper. Si se aprueba y mergea, 36.2 debe implementar el adapter server-only/frontend header sin reabrir backend salvo ajuste menor revisado.

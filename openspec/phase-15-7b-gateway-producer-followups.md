# Phase 15.7b — Gateway producer follow-ups (#54)

## Objetivo
Cerrar los follow-ups no bloqueantes de review de Phase 15.5b / PR #53 sobre el productor `gateway-status`, sin reabrir el bloque Healthcheck ni mezclar nuevas fuentes vivas.

## Decisión de división
La siguiente fase se mantiene como microfase única porque el alcance es pequeño y homogéneo: un productor operativo ya existente, su unidad systemd, guardrail y docs. No se mezcla con UI, cronjobs, backup, adapters nuevos, GitHub counts ni closeout global de Phase 15.

## Alcance
- Registrar explícitamente que `scripts/write-gateway-status.py --output` queda permitido solo para tests/manual controlado.
- Mantener el runner instalado con output fijo vía `npm run write:gateway-status`, sin pasar `--output`.
- Añadir `TimeoutStartSec=30s` a `mugiwara-gateway-status.service` para acotar esperas anómalas alrededor de `systemctl --user is-active` / D-Bus.
- Fsync del directorio padre tras `os.replace` para reforzar durabilidad del manifiesto.
- Reforzar `verify:gateway-status-runner` y pruebas del productor para fijar los contratos.
- Actualizar docs vivas y dejar trazabilidad de cierre de issue #54.

## Fuera de alcance
- Quitar `--output` del CLI: se conserva por utilidad en tests/manual controlado; la garantía estricta aplica al runner instalado.
- Cambiar slugs, cadencia del timer o semántica pública del manifiesto.
- Leer journal, unit files, PIDs, logs, stdout/stderr o detalles de D-Bus.
- Añadir nuevas fuentes Healthcheck, UI, GitHub counts o closeout global de Phase 15.

## Definition of Done
- Tests del productor cubren `--output` como manual/test-only y fsync del directorio padre.
- Unidad systemd incluye `TimeoutStartSec=30s`.
- Guardrail estático exige timeout y fsync.
- Docs declaran el contrato `--output` manual/test-only, output fijo del runner, timeout y fsync.
- Issue #54 queda cerrado o comentado con evidencia tras PR/merge.

## Verify esperado
```bash
PYTHONPATH=. python -m pytest apps/api/tests/test_gateway_status_manifest_producer.py -q
python -m py_compile scripts/write-gateway-status.py apps/api/tests/test_gateway_status_manifest_producer.py
npm run verify:gateway-status-runner
npm run verify:healthcheck-source-policy
systemd-analyze --user verify ops/systemd/user/mugiwara-gateway-status.service ops/systemd/user/mugiwara-gateway-status.timer
git diff --check
```

## Review requerido
Franky + Chopper.

- Franky: timeout systemd, durabilidad del replace y contrato operativo del runner.
- Chopper: que `--output` no se use en el runner instalado, no se abra superficie de escritura arbitraria runtime y no haya leakage de host/systemd.

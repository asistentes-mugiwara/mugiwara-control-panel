# Phase 15.5a — Verify checklist

## Scope check
- [x] Adapter backend de manifiesto fijo para gateways.
- [x] Sin shell/subprocess/systemd en `apps/api/src/modules/healthcheck`.
- [x] Sin cronjobs ni producer gateway en esta microfase.
- [x] Docs vivas y guardrail actualizados.

## TDD evidence
- [x] Test rojo inicial: import de `GatewayStatusManifestAdapter` fallaba antes de implementación.
- [x] Tests de pass seguro con todos los gateways activos.
- [x] Tests de gateway inactivo/parcial sin leakage.
- [x] Tests de manifiesto ausente, ilegible y stale.

## Verify commands
- [x] `PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q` — 42 passed.
- [x] `PYTHONPATH=. python -m pytest apps/api/tests -q` — 71 passed.
- [x] `python -m py_compile apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py`
- [x] `npm run verify:healthcheck-source-policy`
- [x] `npm run verify:perimeter-policy`
- [x] `git diff --check`
- [x] scan dirigido del diff contra secretos, rutas host innecesarias y salidas crudas; solo aparecen marcadores sintéticos en tests/docs para probar el saneado.

## Review
- [ ] PR abierta.
- [ ] Handoff comentado en PR.
- [ ] Franky invocado.
- [ ] Chopper invocado.

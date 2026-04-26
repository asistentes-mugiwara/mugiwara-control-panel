# Phase 15.7b verify checklist

- [x] Alcance dividido como microfase única y no mezclado con nuevas fuentes/UI/closeout global.
- [x] Tests del productor cubren contrato CLI manual/test-only y fsync del directorio padre.
- [x] Unidad systemd incluye `TimeoutStartSec=30s`.
- [x] `verify:gateway-status-runner` exige timeout, fsync y output fijo en runner instalado.
- [x] Docs vivas actualizadas: `docs/healthcheck-source-policy.md`, `docs/read-models.md`, `docs/api-modules.md`.
- [x] Verify ejecutado:
  - `PYTHONPATH=. python -m pytest apps/api/tests/test_gateway_status_manifest_producer.py -q`
  - `python -m py_compile scripts/write-gateway-status.py apps/api/tests/test_gateway_status_manifest_producer.py`
  - `npm run verify:gateway-status-runner`
  - `npm run verify:healthcheck-source-policy`
  - `systemd-analyze --user verify ops/systemd/user/mugiwara-gateway-status.service ops/systemd/user/mugiwara-gateway-status.timer`
  - `git diff --check`
- [ ] PR review Franky + Chopper completada.
- [ ] Issue #54 comentada/cerrada tras merge.

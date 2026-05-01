# Issue #129 — verify checklist

- [x] Backend evita snapshots stale creando `HealthcheckService()` por request en el router.
- [x] `operational_checks[]` existe y contiene `gateways`, `honcho`, `docker_runtime`, `cronjobs`, `vault_sync`, `backup`.
- [x] `/healthcheck` renderiza las seis cards operativas y elimina la bitácora/historial visible.
- [x] Tests backend cubren contrato, degradación y ausencia de exposición sensible recursiva.
- [x] Guardrail estático bloquea copy legacy de `Bitácora histórica` y marcadores sensibles en página.
- [ ] `npm --prefix apps/web run build` ejecutado.
- [ ] Smoke API/HTML/DOM ejecutado.
- [ ] Reviews Franky/Chopper/Usopp completadas antes de merge.

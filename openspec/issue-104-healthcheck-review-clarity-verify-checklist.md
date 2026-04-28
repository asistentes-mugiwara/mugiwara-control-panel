# Issue #104 — Verify checklist

## Backend Healthcheck
- [ ] `PYTHONPATH=. pytest apps/api/tests/test_healthcheck_dashboard_api.py -q`
- [ ] `npm run verify:healthcheck-source-policy`
- [ ] `npm run verify:healthcheck-review-clarity`

## Frontend visible
- [ ] `npm --prefix apps/web run typecheck`
- [ ] `npm --prefix apps/web run build`
- [ ] `npm run verify:visual-baseline`
- [ ] Smoke browser `/healthcheck` con consola limpia y sin overflow evidente.

## Hygiene
- [ ] `git diff --check`
- [ ] PR con resumen claro y reviewers Usopp + Chopper.
- [ ] Tras merge: rebuild web, reinicio `mugiwara-control-panel-web.service`, reinicio API si backend cambió y smoke Tailscale.

## Criterios específicos
- [ ] `En revisión` muestra causa actual visible antes de módulos/bitácora.
- [ ] `Project health` puede ser causa actual sin implicar caída de gateways.
- [ ] La bitácora aparece como histórica y sus eventos `fail` no se muestran como incidencia activa.
- [ ] No se exponen rutas internas, comandos, logs crudos, stdout/stderr, manifests, tokens, prompts ni secrets.

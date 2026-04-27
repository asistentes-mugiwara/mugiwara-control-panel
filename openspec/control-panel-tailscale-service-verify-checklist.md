# Control Panel private Tailscale service — verify checklist

## Preflight
- [x] Repo limpio en `main...origin/main` antes de rama.
- [x] Rama `zoro/control-panel-tailscale-service` creada.
- [x] Tailscale detectado: `<magicdns-host>` / `<tailscale-ip>`.

## Implementación
- [x] API service unit añadido.
- [x] Web service unit añadido.
- [x] API runner añadido.
- [x] Web runner añadido.
- [x] Installer añadido.
- [x] Guardrail estático añadido y enlazado en `package.json`.
- [x] Docs runtime actualizadas.
- [x] `.engram` closeout creado.

## Verify estático y tests
- [x] `npm run verify:control-panel-service-runner`
- [x] `npm run verify:perimeter-policy`
- [x] `npm run verify:health-dashboard-server-only`
- [x] `npm --prefix apps/web run typecheck`
- [x] `PYTHONPATH=. pytest apps/api/tests -q`
- [x] `npm --prefix apps/web run build`
- [x] `systemd-analyze --user verify ops/systemd/user/mugiwara-control-panel-api.service ops/systemd/user/mugiwara-control-panel-web.service`

## Instalación runtime
- [x] `scripts/install-control-panel-user-services.sh`
- [x] `systemctl --user is-active mugiwara-control-panel-api.service`
- [x] `systemctl --user is-active mugiwara-control-panel-web.service`
- [x] `ss -ltnp` confirma API en `127.0.0.1:8011`.
- [x] `ss -ltnp` confirma web en `<tailscale-ip>:3017`.

## Smoke
- [x] `GET http://127.0.0.1:8011/api/v1/healthcheck` responde 200 y `meta.sanitized=true`.
- [x] `GET http://<tailscale-ip>:3017/healthcheck` responde 200.
- [x] HTML por Tailscale renderiza Healthcheck real.
- [x] No-leakage básico API/HTML.
- [x] Browser smoke por Tailscale con consola limpia.

## Cierre
- [x] `git diff --check`
- [ ] PR abierta.
- [ ] Handoff PR dejado.
- [x] Franky invocado y responde.
- [x] Chopper invocado y responde.
- [ ] Reviewers comentan PR o declaran bloqueo por permisos.

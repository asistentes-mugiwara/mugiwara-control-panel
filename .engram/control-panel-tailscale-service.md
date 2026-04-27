# Control Panel private Tailscale service

## Contexto
Después del runtime readiness smoke PR #95, Pablo pidió uso permanente del control panel y acceso por Tailscale fuera de la red local.

## Implementación
Servicios `systemd --user` añadidos e instalados:
- `mugiwara-control-panel-api.service`: FastAPI solo loopback `127.0.0.1:8011`.
- `mugiwara-control-panel-web.service`: Next.js production por Tailscale `<tailscale-ip>:3017`.

Runners:
- `scripts/run-control-panel-api.sh` rechaza API fuera de loopback y usa el Python del venv Hermes con `uvicorn`.
- `scripts/run-control-panel-web.sh` detecta IPv4 Tailscale y rechaza bind wildcard; consume API solo por `http://127.0.0.1:8011`.
- `scripts/install-control-panel-user-services.sh` construye Next production, instala units en `~/.config/systemd/user`, habilita y arranca ambos servicios.

## Verify ejecutado
- `npm run verify:control-panel-service-runner` pasó.
- `npm run verify:perimeter-policy` pasó.
- `npm run verify:health-dashboard-server-only` pasó.
- `npm --prefix apps/web run typecheck` pasó.
- `PYTHONPATH=. pytest apps/api/tests -q` pasó con `129 passed`.
- `npm --prefix apps/web run build` pasó.
- `systemd-analyze --user verify ...api.service ...web.service` pasó.
- Installer ejecutado correctamente.
- `systemctl --user is-active` confirmó ambos servicios `active`.
- `ss -ltnp` confirmó API `127.0.0.1:8011` y web `<tailscale-ip>:3017`.
- Smoke API `/api/v1/healthcheck`: `status=ready`, `meta.sanitized=true`.
- Smoke web Tailscale `/healthcheck`: HTTP 200, módulos reales y no-leakage básico `PASS`.
- Browser smoke Tailscale: consola limpia.
- `loginctl show-user $USER -p Linger` confirmó `Linger=yes`, por lo que los servicios user-level pueden levantarse tras boot sin login interactivo.

## URL de uso
- `http://<tailscale-ip>:3017`
- `http://<magicdns-host>:3017`

## Restricciones vivas
Esto sigue siendo operación privada/Tailscale. No se ha abierto `internet-public`, Tailscale Funnel, API directa, auth pública ni nuevas features.

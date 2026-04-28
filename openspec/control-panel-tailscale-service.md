# Control Panel private Tailscale service

## Objetivo
Dejar `mugiwara-control-panel` siempre levantado como servicios `systemd --user` y accesible por Tailscale fuera de la red local, sin convertirlo en superficie pública de internet.

## Contexto
PR #95 declaró el control plane operativo privado v1 mediante smoke runtime. Pablo pidió poder usarlo de forma permanente y entrar por Tailscale incluso fuera de la LAN.

Runtime Tailscale detectado:
- DNS: `<magicdns-host>`
- IPv4: `<tailscale-ip>`

## Alcance
- Añadir servicio user-level para API FastAPI.
- Añadir servicio user-level para Web Next.js production.
- Mantener API en loopback (`127.0.0.1:8011`).
- Exponer solo la web en la IP Tailscale (`<tailscale-ip>:3017`) o host configurado server-side.
- Añadir scripts runner explícitos, instalador y guardrail estático.
- Instalar, arrancar y verificar smoke real por Tailscale.

## Fuera de alcance
- Exposición `internet-public`.
- Auth pública, OAuth, sesión o rate limiting nuevos.
- Reverse proxy, TLS, Funnel, Serve o MagicDNS HTTPS.
- Nuevas features de UI/backend.
- Nuevas fuentes Healthcheck o capacidades Git.
- Cambios en permisos de manifests Healthcheck.

## Decisiones
1. **API loopback-only**: el backend no se expone directamente por Tailscale. La web server-side consume `http://127.0.0.1:8011`.
2. **Web Tailscale-only por defecto**: el runner web exige una IP Tailscale salvo override explícito. No cae silenciosamente a `0.0.0.0`.
3. **Production Next**: el servicio web usa `next start`, no `next dev`; el installer construye `apps/web/.next` antes de arrancar.
4. **systemd user-level**: evita `User=`/`Group=` y sigue el patrón operativo ya usado por los runners Healthcheck.
5. **Config API local server-only**: la unidad API carga un `EnvironmentFile` no versionado creado por el instalador para habilitar fuentes backend-only como Hermes activity sin poner valores runtime en el repo.
6. **Fail closed**: si Tailscale no está disponible y no hay override, la web falla y systemd reintenta, en vez de abrir en todas las interfaces.

## Definition of Done
- Units versionadas en `ops/systemd/user/`.
- Scripts runner e installer versionados en `scripts/`.
- Installer crea configuración local server-only para la fuente Hermes activity sin versionar valores runtime.
- Guardrail `verify:control-panel-service-runner` pasa.
- `systemd-analyze --user verify` acepta ambas units.
- Installer instala, habilita y arranca ambos servicios.
- `systemctl --user is-active` devuelve `active` para API y web.
- API responde localmente en `127.0.0.1:8011/api/v1/healthcheck`.
- Web responde por Tailscale en `http://<tailscale-ip>:3017/healthcheck`.
- No-leakage básico en HTML production por Tailscale.
- Browser smoke por Tailscale sin errores de consola.

## Verify esperado
- `npm run verify:control-panel-service-runner`
- `systemd-analyze --user verify ops/systemd/user/mugiwara-control-panel-api.service ops/systemd/user/mugiwara-control-panel-web.service`
- `scripts/install-control-panel-user-services.sh`
- `systemctl --user is-active mugiwara-control-panel-api.service mugiwara-control-panel-web.service`
- `curl -fsS http://127.0.0.1:8011/api/v1/healthcheck`
- `curl -fsS http://<tailscale-ip>:3017/healthcheck`
- no-leakage scan API/HTML
- browser smoke Tailscale
- `npm run verify:perimeter-policy`
- `npm run verify:health-dashboard-server-only`
- `npm --prefix apps/web run typecheck`
- `PYTHONPATH=. pytest apps/api/tests -q`
- `npm --prefix apps/web run build`
- `git diff --check`

## Review
Requiere Franky + Chopper:
- Franky: operabilidad, systemd user, restart policy, Tailscale bind, build/start, rollback.
- Chopper: perímetro, no exposición pública, no leakage, API loopback-only.


## Resultados ejecutados
- Servicios instalados y habilitados como `systemd --user`.
- `Linger=yes` confirmado para el usuario operativo.
- API activa en `127.0.0.1:8011`.
- Web activa en `<tailscale-ip>:3017`.
- URL privada usable: `http://<tailscale-ip>:3017` y `http://<magicdns-host>:3017`.
- Smoke API `/api/v1/healthcheck`: HTTP 200, `status=ready`, `meta.sanitized=true`.
- Smoke web Tailscale `/healthcheck`: HTTP 200, módulos reales renderizados y consola limpia.
- No-leakage básico API/HTML: `PASS`.

- Franky dejó `approve` operativo con follow-ups documentales menores ya incorporados: rollback exacto, validación de `Linger=yes` y nota de actualización si cambia la IP Tailscale.

## Incidencia corregida
El primer arranque de API falló bajo systemd porque el entorno user service resolvía `python3` a `/usr/bin/python3`, sin `uvicorn`. Se corrigió el runner para usar por defecto `/home/agentops/.hermes/hermes-agent/venv/bin/python3`, con override explícito `MUGIWARA_CONTROL_PANEL_PYTHON` si más adelante se crea un venv propio del proyecto.

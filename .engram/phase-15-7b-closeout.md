# Phase 15.7b closeout — Gateway producer follow-ups

## Resumen
Phase 15.7b cierra el issue #54 derivado de review de Phase 15.5b. El productor `gateway-status` conserva `--output` solo para tests/manual controlado, mientras el runner instalado sigue usando el output fijo vía `npm run write:gateway-status`.

## Cambios técnicos
- `mugiwara-gateway-status.service` añade `TimeoutStartSec=30s` para limitar esperas anómalas alrededor de `systemctl --user is-active` / D-Bus.
- `scripts/write-gateway-status.py` fsynca el directorio padre después de `os.replace` y `chmod` del manifiesto.
- `verify:gateway-status-runner` fija timeout, fsync y contrato de output fijo en systemd.
- Tests del productor cubren fsync de directorio y renombran el test CLI como manual/test-only.

## Continuidad
- No se añadieron fuentes Healthcheck ni superficie host nueva.
- El backend sigue sin systemd, shell, journal ni filesystem discovery.
- Review requerida: Franky + Chopper por runtime systemd y frontera host/security.
- Tras merge, comentar/cerrar issue #54 y continuar con Phase 15 closeout/canon refresh salvo que Pablo priorice UI issues #44/#45.

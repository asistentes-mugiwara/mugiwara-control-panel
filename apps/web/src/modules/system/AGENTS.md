# AGENTS.md — apps/web/src/modules/system

## Rol
Módulo frontend read-only para métricas globales de sistema consumidas por el header del shell.

## Reglas
- El adapter HTTP debe ser `server-only` y usar únicamente `MUGIWARA_CONTROL_PANEL_API_URL` en servidor.
- No introducir `NEXT_PUBLIC_*`, fetch desde navegador al backend interno ni route/proxy genérico.
- No renderizar URL backend, paths host, stack traces, errores crudos, stdout/stderr, logs ni detalles de configuración.
- El header recibe solo snapshot serializable saneado y degrada a valores `—` si la fuente falta o falla.
- Si se añade polling, cache/TTL o refresh cliente, abrir microfase propia y pedir review Franky + Chopper.

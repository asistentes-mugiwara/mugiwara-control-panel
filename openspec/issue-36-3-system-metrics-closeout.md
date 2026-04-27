# Issue #36.3 — System metrics guardrails, canon and closeout

## Estado
- **Fase:** 36.3 — guardrails/canon/closeout final.
- **Rama:** `zoro/issue-36-3-system-metrics-closeout`.
- **Issue:** [#36 Always-visible header system metrics](https://github.com/asistentes-mugiwara/mugiwara-control-panel/issues/36).
- **Base previa:**
  - 36.0 / PR #84 planificó la feature.
  - 36.1 / PR #85 cerró backend read model/API.
  - 36.2 / PR #86 cerró adapter frontend server-only + header integration.

## Objetivo
Cerrar #36 fijando por guardrail y canon que las métricas RAM/disco/uptime quedan como una superficie host-adjacent pequeña, backend-owned y consumida por el header solo desde frontera server-only de Next.js.

## Alcance
- Añadir `npm run verify:system-metrics-server-only`.
- Fijar invariantes frontend:
  - adapter `server-only`;
  - env privada `MUGIWARA_CONTROL_PANEL_API_URL`;
  - endpoint fijo `/api/v1/system/metrics`;
  - `RootLayout` dinámico;
  - `AppShell`/`Topbar` sin fetch, sin `process.env`, sin backend URL y sin `NEXT_PUBLIC_*`;
  - fallback a snapshot saneado con valores `—`;
  - labels de header cortos/estables para responsive (`RAM`, `Disco`, `Uptime`).
- Actualizar docs vivas (`runtime-config`, `read-models`) para el estado final.
- Mantener el guardrail backend 36.1 separado: `verify:system-metrics-backend-policy`.
- Dejar checklist y closeout de la fase.

## Fuera de alcance
- No añadir polling, cache/TTL, refresh cliente ni rutas BFF nuevas.
- No tocar el backend de métricas salvo regresión detectada por verify.
- No cerrar #40 ni abrir Git control page.
- No cambiar la semántica operativa revisada por Franky en 36.1.
- No introducir Playwright/visual regression pesada.

## Verify esperado
- `npm run verify:system-metrics-server-only`.
- `npm run verify:system-metrics-backend-policy`.
- `npm run verify:perimeter-policy`.
- `npm run verify:healthcheck-source-policy`.
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build`.
- `npm run verify:visual-baseline`.
- `PYTHONPATH=. pytest apps/api/tests/test_system_metrics_api.py apps/api/tests/test_perimeter_api.py -q`.
- Smoke HTML/DOM contra fugas:
  - backend URL;
  - `MUGIWARA_CONTROL_PANEL_API_URL`;
  - `NEXT_PUBLIC`;
  - `SystemMetricsApiError`;
  - `Traceback` / `Stack trace`;
  - `/proc/meminfo` / `/proc/uptime`.
- `git diff --check`.

## Review
- **Chopper:** obligatorio por guardrail de no-leakage y frontera server-only/host-adjacent.
- **Usopp:** obligatorio porque el closeout fija el responsive y la semántica visual de header de la feature completa.
- **Franky:** no obligatorio salvo que se introduzca polling/cache/TTL, cambio de fuente runtime o cambio operativo; esta fase solo fija guardrails/canon sobre decisiones ya aprobadas por Franky en 36.1.

## Criterio de cierre de #36
#36 se puede cerrar solo cuando:
- PR 36.3 esté mergeada;
- todos los verify pasen;
- Chopper y Usopp hayan aprobado o declarado mergeable;
- Project Summary del vault quede actualizado;
- Engram registre el cierre final;
- el issue tenga comentario final con 36.0/36.1/36.2/36.3 y riesgos residuales.

## Riesgos residuales
- Si el control panel se expone fuera del perímetro privado, el endpoint host-adjacent requiere auth/sesión/rate-limit antes de considerarse seguro.
- Si se añade polling/refresh posterior, debe abrirse fase propia con coste/frecuencia/cache y review Franky + Chopper.
- El visual verify sigue siendo baseline manual; no sustituye visual regression automatizada futura si el producto lo requiere.

# Issue #36 — Always-visible header system metrics plan

## Estado
- **Fase:** 36.0 — Planning / architecture.
- **Fecha:** 2026-04-27.
- **Rama:** `zoro/issue-36-header-system-metrics-plan`.
- **Issue:** [#36 Always-visible header system metrics](https://github.com/asistentes-mugiwara/mugiwara-control-panel/issues/36).
- **Alcance de esta PR:** planificación, contrato, microfases, verify y frontera de reviewers. No implementa backend, contrato compartido, adapter frontend ni UI final.

## Objetivo del issue
Añadir una banda de métricas de sistema siempre visible en el header del control panel:

- RAM usada como número.
- RAM total como número.
- RAM usada en porcentaje.
- Disco usado como número.
- Disco total como número.
- Disco usado en porcentaje.
- Uptime del servidor en días, horas y minutos.

## Por qué planificar antes de implementar
El issue mezcla tres fronteras de riesgo:

1. **Host-adjacent reads:** RAM, disco y uptime salen del sistema operativo o de fuentes derivadas del host.
2. **Contrato/API backend:** la lectura debe quedar en FastAPI como frontera de seguridad, no en navegador.
3. **Header visible y responsive:** la UI afecta al app shell global, mobile/tablet/desktop y percepción permanente de estado.

La experiencia de Phase 15–18 en Healthcheck demuestra que las lecturas host-adjacent deben entrar por contratos pequeños, fuentes allowlisted, tests negativos de leakage y review Franky + Chopper. La experiencia de Phase 16–17 demuestra que UI visible y responsive debe entrar separada y con review Usopp cuando ya exista contrato saneado.

## Contexto real consultado
- `Project Summary - Mugiwara Control Panel` en el vault: Phase 18 Healthcheck producers está cerrada/canonizada por PR #83; solo siguen abiertas #36 y #40.
- `docs/api-modules.md`, `docs/read-models.md`, `docs/runtime-config.md`, `docs/security-perimeter.md`, `docs/healthcheck-source-policy.md`.
- `docs/frontend-ui-spec.md` y `docs/frontend-implementation-handoff.md`.
- `apps/web/src/app/layout.tsx` y shell/header actual:
  - `AppShell` es client component global.
  - `Topbar` es client component con identidad, command chip y `StatusBadge` operativo.
  - `PageHeader` es header de página, no el header global siempre visible.
- Adapters server-only existentes en `apps/web/src/modules/*/api/*-http.ts` con `import 'server-only'`, env privada `MUGIWARA_CONTROL_PANEL_API_URL`, fallback saneado y rutas fijas.
- Backend modular actual en `apps/api/src/modules/*` y routers incluidos explícitamente desde `apps/api/src/main.py`.
- Tests backend existentes en `apps/api/tests/test_*_api.py` y productores Healthcheck.
- Guardrails existentes: `verify:health-dashboard-server-only`, `verify:perimeter-policy`, `verify:healthcheck-source-policy`, `verify:usage-server-only` y otros checks server-only por módulo.
- Closeout Phase 18.5: Healthcheck producers completos; no reabrir productores salvo bug/regresión.
- Closeout Phase 17.4d: Usage cerrado; patrón de server-only/read-only + UI visible + guardrail + visual baseline.

## Decisiones de arquitectura de 36.0

### 1. Crear módulo backend específico `system`
Preferencia fijada para implementación futura: crear un módulo backend read-only específico, probablemente `apps/api/src/modules/system/`, en vez de mezclar estas métricas dentro de Healthcheck, Dashboard o Usage.

Motivo:
- Las métricas del header son un read model global de sistema, no un productor Healthcheck ni una agregación de Dashboard.
- Evita reabrir Phase 18 Healthcheck producers.
- Permite un endpoint fijo, pequeño y revisable con tests de seguridad propios.
- Mantiene el backend como frontera única para host-adjacent reads.

Nombre de endpoint recomendado:

```text
GET /api/v1/system/metrics
```

Alternativa aceptable si el repo pide otro naming en 36.1: `GET /api/v1/system-metrics`, pero no usar rutas genéricas ni proxy.

### 2. Fuente backend allowlisted, sin input cliente
El endpoint no debe aceptar `path`, `mount`, `device`, `command`, `url`, `method`, `interval`, `host`, `target` ni otros parámetros controlados por cliente.

Fuente propuesta por métrica:

- **RAM:** lectura OS allowlisted desde APIs Python stdlib/procfs revisadas. Preferir `/proc/meminfo` parseado de forma estrecha si no se introduce dependencia nueva; alternativamente `os.sysconf` solo si permite total/used correcto con criterio operativo documentado. No usar shell.
- **Disco:** target único backend-owned y documentado. Recomendación inicial: `/` como capacidad operacional del host del control panel, salvo que Franky recomiende otro path operacional. Puede implementarse con `shutil.disk_usage(<target fijo>)`. No exponer el path crudo en la respuesta pública por defecto.
- **Uptime:** lectura allowlisted desde `/proc/uptime` o API equivalente, parseo estrecho, sin shell y sin comandos tipo `uptime`.

### 3. Salida saneada mínima
Contrato recomendado para 36.1:

```json
{
  "ram": {
    "used_bytes": 123,
    "total_bytes": 456,
    "used_percent": 27.0
  },
  "disk": {
    "used_bytes": 123,
    "total_bytes": 456,
    "used_percent": 27.0
  },
  "uptime": {
    "days": 1,
    "hours": 2,
    "minutes": 3
  },
  "updated_at": "2026-04-27T12:00:00Z",
  "source_state": "live"
}
```

Notas:
- `used_percent` debe derivarse del mismo snapshot que bytes usados/totales, con redondeo documentado y tests contra total cero/malformado.
- `source_state` debe usar vocabulario pequeño y final-user-safe: `live`, `degraded`, `not_configured` o equivalente alineado con patrones existentes.
- No serializar hostname, mount table, device, path, process list, users, raw `/proc`, stdout/stderr, logs, excepciones ni stack traces.

### 4. Frontend: adapter server-only + paso de props al shell
El shell actual (`AppShell`/`Topbar`) es client-side. La implementación frontend no debe hacer fetch desde browser a la URL real del backend ni leer host metrics en cliente.

Patrón recomendado para 36.2:
- Añadir un adapter server-only en un módulo nuevo `apps/web/src/modules/system/api/system-metrics-http.ts` con `import 'server-only'`, `MUGIWARA_CONTROL_PANEL_API_URL`, endpoint fijo `/api/v1/system/metrics`, validación `http(s)`, `cache: 'no-store'` salvo decisión explícita de caching.
- Crear una frontera server component en el layout o wrapper del shell que obtiene el snapshot y lo pasa a `AppShell`/`Topbar` como prop serializable saneada.
- Mantener `AppShell`/`Topbar` como client components si hace falta para navegación móvil, pero sin fetch directo ni env backend.
- Hacer el root layout dinámico si lee runtime config (`export const dynamic = 'force-dynamic'`) o aislar la lectura en un server wrapper dinámico equivalente. Verificar que no se congela fallback en build.
- Fallback/degradado: renderizar banda compacta con valores no disponibles, sin errores crudos ni backend URL.

### 5. No polling agresivo en primera UI
El primer corte UI debe ser snapshot server-rendered por navegación/request. Si se propone refresh/polling en 36.2 o 36.3, debe documentar frecuencia, coste, caché y reviewer Franky + Chopper. Por defecto: sin polling agresivo.

## Fuera de alcance de 36.0
- No implementar módulo backend `system`.
- No modificar `apps/api/src/main.py`.
- No crear contratos TypeScript definitivos.
- No tocar `Topbar`, `AppShell`, CSS ni UI final.
- No añadir scripts de guardrail.
- No actualizar productores/timers Healthcheck.
- No tocar issue #40.
- No cerrar issue #36.

## Microfases propuestas

### 36.0 — Planning / architecture
**Esta fase.**

Entregables:
- `openspec/issue-36-header-system-metrics-plan.md`.
- `openspec/issue-36-header-system-metrics-planning-verify-checklist.md`.
- `.engram/issue-36-header-system-metrics-plan-closeout.md`.
- Observación Engram con la estrategia de microfases.

DoD:
- Estado real de repo, issue, PRs e issues abiertos verificado.
- Docs, closeouts y shell/header real consultados.
- Contrato, riesgos, fuera de alcance, reviewers y verify por microfase definidos.
- PR docs/OpenSpec abierta sin runtime changes.

Verify:
- `git status --short --branch`.
- `git fetch origin --prune` + `git switch main` + `git pull --ff-only origin main` antes de rama.
- `gh issue view 36`.
- `gh issue list --state open`.
- `gh pr list --state open`.
- Lectura dirigida de docs/shell/adapters/backend/tests/guardrails.
- `git diff --check`.

Review:
- Franky + Chopper, porque el plan toma decisiones sobre host metrics y frontera de seguridad aunque el diff sea documental.
- Usopp no bloquea 36.0; entra en 36.2 para UI/header responsive. Si Usopp quiere opinar antes, puede hacerlo como follow-up no bloqueante.

### 36.1 — Backend read model/API foundation
Objetivo: crear el módulo backend read-only `system` y endpoint fijo `GET /api/v1/system/metrics`.

Follow-ups incorporados tras review 36.0:
- Si se usa `/proc/meminfo`, RAM usada debe calcularse como `MemTotal - MemAvailable`, no `MemTotal - MemFree`.
- El target de disco inicial `/` debe documentarse como “filesystem raíz visible por el proceso FastAPI” y revalidarse si el despliegue pasa a contenedor/namespace distinto.
- La degradación debe permitir distinguir fuente RAM/disco/uptime fallida sin exponer internals.
- Añadir test/guardrail explícito de no-leakage recursivo y de ausencia de shell/subprocess/comandos host.

Alcance:
- Dominio/servicio/router `system` con capas simples y tests.
- Contrato compartido si el patrón del repo lo pide (`packages/contracts/src/read-models.ts`).
- Lectores host allowlisted y estrechos para RAM, disco y uptime.
- Fallback/degradación saneada si una fuente no está disponible o viene malformada.
- Sin UI, sin polling, sin guardrail frontend final.

DoD técnico:
- Endpoint fijo sin input cliente.
- No shell genérico, no `subprocess`, no comandos `free`, `df`, `uptime`, no Docker/systemd, no filesystem discovery.
- Disco usa target backend-owned, preferiblemente `/`, con decisión Franky documentada.
- Respuesta no contiene paths, mount internals, device names, hostname, procesos, usuarios, raw `/proc`, logs, stdout/stderr, stack traces, `.env`, tokens ni credenciales.
- `updated_at` timezone-aware y saneado.
- `source_state` explícito.

Tests mínimos:
- Caso normal RAM/disk/uptime.
- Fuente RAM ausente/malformada.
- Fuente disco no disponible o total cero.
- Fuente uptime ausente/malformada.
- No-leakage recursivo del payload público.
- Endpoint rechaza/ignora cualquier intento de input inesperado si se materializa por query/path.
- Perímetro/headers siguen saneados.

Verify recomendado:
- `PYTHONPATH=. pytest apps/api/tests/test_system_metrics_api.py -q`.
- `PYTHONPATH=. pytest apps/api/tests/test_perimeter_api.py apps/api/tests/test_healthcheck_dashboard_api.py -q` si toca main/router común.
- `python3 -m py_compile` sobre módulos nuevos.
- `npm run verify:perimeter-policy`.
- `npm run verify:healthcheck-source-policy` para demostrar que no se reabrió Healthcheck.
- `git diff --check`.

Review:
- Franky + Chopper obligatorios.

### 36.2 — Frontend server-only adapter + header integration
Objetivo: mostrar las métricas saneadas en el header global siempre visible.

Follow-up incorporado tras review 36.0:
- El verify de 36.2 debe incluir smoke HTML/DOM/bundle para confirmar que no aparecen backend URL, `NEXT_PUBLIC_*`, paths internos ni errores crudos.

Alcance:
- Adapter server-only `system`/`system-metrics` con endpoint fijo.
- Tipos compartidos o locales alineados con contrato 36.1.
- Integración con root layout/AppShell/Topbar pasando snapshot saneada desde servidor a cliente.
- Render compacto desktop/tablet/mobile.
- Estado degradado/fallback sobrio sin layout jump ni error crudo.
- Sin endpoints nuevos ni cambios backend salvo ajuste menor de contrato ya aprobado.

DoD técnico:
- La URL backend vive solo en `MUGIWARA_CONTROL_PANEL_API_URL`; no `NEXT_PUBLIC_*`.
- No fetch directo de browser a backend interno.
- `Topbar` no lee `process.env`, host, `/proc`, filesystem ni URLs arbitrarias.
- Root/layout dinámico o wrapper dinámico si lee runtime config.
- Mobile prioriza jerarquía: porcentaje + label corto si no cabe; desktop puede mostrar usados/totales + porcentaje.
- No overflow horizontal; no ruido visual permanente.
- Fallback renderiza estado degradado, no stack/error/raw config.

Verify recomendado:
- Red inicial del futuro `verify:system-metrics-server-only` o check equivalente si se crea en 36.2.
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build` y comprobar que la ruta/layout afectada no congela fallback si depende de runtime config.
- `npm run verify:visual-baseline`.
- Browser smoke en desktop/tablet/mobile: header visible, consola limpia, sin overflow horizontal.
- Smoke HTML/DOM: no backend URL, no `NEXT_PUBLIC`, no paths internos ni raw errors.
- Backend tests 36.1 si cambia contrato.
- `git diff --check`.

Review:
- Usopp + Chopper obligatorios.
- Franky si se añade polling, cache/TTL, frecuencia de refresh, cambio de runtime o ajuste operativo.

### 36.3 — Guardrails, visual baseline, docs/canon and issue closeout
Objetivo: endurecer el contrato completo y cerrar #36 solo después de backend + UI verificados.

Alcance:
- Añadir guardrail estático específico `verify:system-metrics-server-only` o ampliar guardrail existente solo si encaja de forma clara.
- Fijar invariantes:
  - endpoint fijo `/api/v1/system/metrics`;
  - adapter frontend server-only;
  - ausencia de `NEXT_PUBLIC_*` para backend;
  - no browser-side host reads;
  - no proxy genérico;
  - no shell/subprocess/comandos host para métricas;
  - no paths/logs/stdout/stderr/raw `/proc`/mount table/process list/users/hostname.
- Actualizar docs vivas y Project Summary del vault si la feature queda cerrada.
- Cerrar issue #36 solo al final, con PR mergeada y verify completo.

Verify recomendado:
- `npm run verify:system-metrics-server-only`.
- `npm run verify:perimeter-policy`.
- `npm run verify:healthcheck-source-policy`.
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build`.
- `npm run verify:visual-baseline`.
- `PYTHONPATH=. pytest apps/api/tests/test_system_metrics_api.py apps/api/tests/test_perimeter_api.py -q`.
- Browser smoke con API local de la rama.
- `git diff --check`.
- `git status --short --branch`.

Review:
- Chopper + Usopp obligatorios.
- Franky obligatorio si guardrails/canon documentan refresh/cache/runtime source o si 36.1/36.2 dejaron follow-ups operativos.

## Registro de riesgos

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Convertir métricas en consola host genérica | Alto seguridad | Endpoint fijo, sin input cliente, no shell/subprocess, tests negativos y Chopper. |
| Exponer rutas/mounts/devices/host internals | Alto seguridad | No serializar target disk ni raw source; no-leakage recursivo. |
| Reabrir Healthcheck producers | Medio/alto scope | Módulo `system` separado; Healthcheck queda intacto salvo guardrail de no regresión. |
| Header client-side fetch a backend interno | Alto perímetro | Adapter server-only + props serializables; guardrail contra `NEXT_PUBLIC_*` y fetch browser. |
| Fallback congelado por build estático | Medio UX/operación | Layout/wrapper dinámico si lee runtime config; verify build. |
| Polling agresivo en header | Medio operación/performance | No polling por defecto; si se introduce, review Franky + Chopper y coste documentado. |
| Header saturado o rompe mobile | Medio UX | Separar UI en 36.2 con Usopp; visual baseline y browser smoke responsive. |
| Métricas incoherentes por snapshots distintos | Medio confianza | Calcular cada familia desde snapshot estrecho; documentar redondeo y timestamps. |

## Política de ramas, PR y cierre
- Rama de planificación: `zoro/issue-36-header-system-metrics-plan`.
- Cada microfase posterior debe usar rama propia `zoro/issue-36-...` y PR propia.
- Commits con trailers Mugiwara.
- No cerrar issue #36 hasta completar 36.3 y validar backend + frontend + guardrails + docs/canon.
- No tocar issue #40.

## Siguiente paso recomendado tras 36.0
Ejecutar 36.1 como microfase backend-only con TDD estricto: primero tests rojos de contrato/no-leakage/degradación, después módulo `system`, endpoint fijo y review Franky + Chopper antes de entrar en UI.

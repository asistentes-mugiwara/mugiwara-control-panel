# Configuración runtime del control plane

## Principio
El control plane distingue entre configuración pública de frontend y configuración privada de servidor.

- Las variables `NEXT_PUBLIC_*` pueden acabar embebidas en bundles cliente y solo deben usarse para valores no sensibles que el navegador pueda conocer.
- Las variables sin prefijo `NEXT_PUBLIC_` deben leerse solo desde server loaders, adapters server-only o backend.
- Cualquier URL o ruta que revele topología interna debe preferir configuración server-only cuando la página pueda cargar los datos desde servidor.

## Perímetro soportado
El contrato de perímetro vive en `docs/security-perimeter.md`.

Resumen operativo:

- acceso soportado: desarrollo local, red privada controlada y Tailscale/private access;
- `internet-public: unsupported` hasta que existan decisiones explícitas de auth, sesión, CSRF y rate limiting;
- `/skills` es la única superficie write-capable del MVP y quedó endurecida en Phase 13; las nuevas fuentes reales de Healthcheck deben entrar después como #16 bajo ese perímetro cerrado;
- los valores de topología interna no deben aparecer en UI, logs, errores, bundles cliente ni documentación con hostnames reales.

Guardarraíl de este contrato:

```bash
npm run verify:perimeter-policy
```

## Variables actuales

| Variable | Consumidor | Exposición | Uso |
| --- | --- | --- | --- |
| `MUGIWARA_CONTROL_PANEL_API_URL` | `/memory`, `/mugiwaras`, `/skills` BFF/server loaders, `/vault`, `/dashboard`, `/healthcheck` | Server-only | Base URL del backend para superficies que deben resolver datos desde servidor o frontera BFF. Debe apuntar a loopback, red privada o Tailscale/private hostname; no es configuración pública de navegador. |
| `MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS` | `/skills` BFF write routes | Server-only | Allowlist separada por comas de orígenes exactos `http:`/`https:` permitidos para `POST`/`PUT` de Skills. Debe contener solo orígenes privados/locales/Tailscale; si falta, las escrituras BFF devuelven `403 trusted_origins_not_configured`. |
| `MUGIWARA_HERMES_PROFILES_ROOT` | Backend `usage.hermes_activity` | Server-only | Raíz local de perfiles Hermes usada solo por el backend para agregados read-only. Si falta, el endpoint degrada a `not_configured`; el valor runtime y las rutas de bases de datos no se serializan en API ni UI. |

## Usage
`/usage` usa fuentes server-side/read-only desde Phase 17:

1. El frontend consume el backend mediante adapter `server-only` y `MUGIWARA_CONTROL_PANEL_API_URL`, sin `NEXT_PUBLIC_*` ni lectura directa de env en la página.
2. `GET /api/v1/usage/current`, `calendar` y `five-hour-windows` leen únicamente la SQLite saneada de Codex usage.
3. `GET /api/v1/usage/hermes-activity` lee actividad Hermes solo si `MUGIWARA_HERMES_PROFILES_ROOT` está configurado en el backend; abre perfiles allowlisted en modo lectura y serializa únicamente agregados por perfil/rango.
4. La actividad Hermes no devuelve rutas, prompts, conversaciones, payloads de herramientas, tokens por sesión/conversación, identificadores, secrets, cabeceras, cookies ni logs; si la fuente falta o falla, degrada a `not_configured`.
5. La UI consume `hermes-activity?range=7d` mediante el mismo adapter server-only y muestra solo agregados por perfil/rango como correlación orientativa, sin valores internos de configuración ni rutas.

Antes de cerrar cambios que toquen Usage config, ejecutar:

```bash
npm run verify:usage-server-only
```

## Memory
`/memory` usa el patrón server-only desde Phase 12.3c:

1. `apps/web/src/modules/memory/api/memory-http.ts` importa `server-only`.
2. El adapter lee `MUGIWARA_CONTROL_PANEL_API_URL`.
3. La base URL se valida como `http:` o `https:` antes del fetch.
4. `/memory` declara `export const dynamic = 'force-dynamic'` para leer la configuración en runtime y evitar prerender estático con fallback congelado.
5. Si la variable falta o es inválida, la página mantiene fallback saneado y no muestra el valor de la URL.

Ejemplo de smoke local:

```bash
PYTHONPATH=. uvicorn apps.api.src.main:app --host 127.0.0.1 --port 8011
MUGIWARA_CONTROL_PANEL_API_URL=http://127.0.0.1:8011 npm --prefix apps/web run dev -- --hostname 127.0.0.1 --port 3017
```

## Guardarraíl de Memory
Antes de cerrar cambios que toquen Memory config, ejecutar:

```bash
npm run verify:memory-server-only
```

Este check confirma que Memory mantiene:

- adapter `server-only`;
- env privada `MUGIWARA_CONTROL_PANEL_API_URL`;
- ausencia de `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` en el adapter y el aviso operativo de `/memory`;
- render dinámico de `/memory`.

## Mugiwaras
`/mugiwaras` usa el patrón server-only desde Phase 12.3f:

1. `apps/web/src/modules/mugiwaras/api/mugiwaras-http.ts` importa `server-only`.
2. El adapter lee `MUGIWARA_CONTROL_PANEL_API_URL`.
3. La base URL se valida como `http:` o `https:` antes del fetch.
4. `/mugiwaras` mantiene `export const dynamic = 'force-dynamic'` para leer la configuración en runtime.
5. Si la variable falta o es inválida, la página mantiene fixture saneado y no muestra AGENTS.md.

Antes de cerrar cambios que toquen Mugiwaras config, ejecutar:

```bash
npm run verify:mugiwaras-server-only
```

## Skills
`/skills` usa el patrón BFF/server-only desde Phase 12.3h:

1. El navegador llama solo a endpoints same-origin bajo `/api/control-panel/skills/**`.
2. `apps/web/src/modules/skills/api/skills-server-http.ts` importa `server-only` y lee `MUGIWARA_CONTROL_PANEL_API_URL`.
3. La base URL se valida como `http:` o `https:` antes del fetch upstream.
4. Los route handlers de Next.js usan `cache: 'no-store'`, `force-dynamic` y endpoints allowlisted, no proxy genérico.
5. Las rutas BFF validan `skillId`, método, `Content-Type`, tamaño y schema antes de reenviar preview/update.
6. Las rutas write-capable (`POST` preview y `PUT` update) exigen `MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS` y rechazan `Origin` ausente o no confiable antes de procesar el cuerpo.
7. Los errores devueltos al navegador están saneados y no incluyen backend URL, stack traces, bodies, diffs ni secretos.
8. FastAPI sigue siendo fuente de verdad para allowlist, path safety, stale hash, edición y auditoría.
9. Los endpoints `/api/control-panel/skills/**`, especialmente `PUT`, pertenecen al control plane privado: no deben exponerse fuera de Tailscale/perímetro autenticado sin añadir auth/autorización server-side y rate limiting.

Antes de cerrar cambios que toquen Skills config o BFF, ejecutar:

```bash
npm run verify:skills-server-only
```

## Vault
`/vault` usa el patrón server-only desde Phase 12.4 y hace visible el fallback degradado desde Phase 12.6a:

1. `apps/web/src/modules/vault/api/vault-http.ts` importa `server-only`.
2. El adapter lee `MUGIWARA_CONTROL_PANEL_API_URL` y valida esquema `http:`/`https:`.
3. `/vault` declara `export const dynamic = 'force-dynamic'`.
4. Si la API falta, falla o devuelve un payload inválido, la página mantiene fixture documental saneado y muestra aviso explícito de estado degradado.
5. El aviso no expone URL backend, rutas host, stack traces ni cuerpo de respuesta.

Antes de cerrar cambios que toquen Vault config o fallback, ejecutar:

```bash
npm run verify:vault-server-only
```

## Dashboard y Healthcheck
`/dashboard` y `/healthcheck` usan el patrón server-only desde Phase 12.5:

1. `apps/web/src/modules/dashboard/api/dashboard-http.ts` y `apps/web/src/modules/healthcheck/api/healthcheck-http.ts` importan `server-only`.
2. Ambos adapters leen `MUGIWARA_CONTROL_PANEL_API_URL` y validan esquema `http:`/`https:`.
3. `/dashboard` y `/healthcheck` declaran `export const dynamic = 'force-dynamic'`.
4. Los fetches usan `cache: 'no-store'`.
5. Si la API falta o falla, ambas páginas muestran fallback local saneado con aviso visible; no muestran comandos, logs, detalles internos de ejecución, URLs internas ni detalles host.
6. Healthcheck sigue usando un catálogo backend-owned saneado; Phase 14.1 endureció este camino parseando timestamps explícitamente para agregación de frescura y haciendo que Dashboard respete severidad `critical` a nivel de registro. Los conectores reales auditados y el enforcement de allowlist de backend host siguen como trabajo futuro separado si la topología de despliegue lo requiere.

Antes de cerrar cambios que toquen Dashboard/Healthcheck config o fallback, ejecutar:

```bash
npm run verify:health-dashboard-server-only
```

## System metrics header
El header global consume `GET /api/v1/system/metrics` desde Phase 36.2 mediante un adapter frontend `server-only`:

1. `apps/web/src/modules/system/api/system-metrics-http.ts` importa `server-only`, lee solo `MUGIWARA_CONTROL_PANEL_API_URL` y valida esquema `http:`/`https:`.
2. `apps/web/src/app/layout.tsx` es dinámico (`force-dynamic`), obtiene un snapshot server-side por request/navegación y pasa props serializables a `AppShell`/`Topbar`.
3. `AppShell` y `Topbar` siguen siendo client components por la navegación responsive, pero no hacen fetch, no leen `process.env` y no conocen la URL backend.
4. Si la API falta, falla o devuelve payload inválido, el header muestra métricas `—` y estado degradado/sin datos sin URL backend, errores crudos, stack traces, paths host ni detalles de configuración.
5. Este primer corte no añade polling, cache/TTL ni refresh cliente. Si se introduce refresco posterior, requiere diseño y review Franky + Chopper.

Antes de cerrar cambios que toquen el header de métricas de sistema, ejecutar:

```bash
npm run verify:system-metrics-server-only
```

Este check confirma que el header mantiene:

- adapter `server-only`;
- env privada `MUGIWARA_CONTROL_PANEL_API_URL`;
- endpoint fijo `/api/v1/system/metrics`;
- root layout dinámico;
- ausencia de `NEXT_PUBLIC_*`;
- ausencia de fetch/env/backend URL en `AppShell`/`Topbar`;
- fallback saneado sin errores crudos ni rutas host.

## Git control backend
Issue #40.1 añade backend `GET /api/v1/git/repos` y `GET /api/v1/git/repos/{repo_id}/status`; Issue #40.2 amplía la misma frontera con `GET /api/v1/git/repos/{repo_id}/commits?limit=&cursor=` y `GET /api/v1/git/repos/{repo_id}/branches`.

1. No requiere variable runtime nueva: la registry Git es backend-owned y deny-by-default.
2. El cliente opera solo con `repo_id`; para commits solo puede aportar `limit` `1..50` y cursor opaco `offset:<n>` generado por backend. No existen parámetros `path`, `url`, `remote`, `command`, `ref`, `branch`, `sha` ni `revspec` controlando Git.
3. Las rutas reales de la registry pueden existir internamente en backend, pero no se serializan en API, UI, logs públicos, errores ni docs públicas.
4. La lectura Git de 40.2 es status/commits/branches-locales: no hay diffs, working-tree diff, remotes ni acciones destructivas/remotas. La lista de commits publica metadata mínima y trailers allowlisteados; no publica el cuerpo libre del commit.
5. Toda invocación Git mantiene `shell=False`, cwd fijo, timeout, env mínimo, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_SYSTEM=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`, `core.fsmonitor=false` y `core.hooksPath=/dev/null`.
6. Antes de cerrar cambios que toquen esta frontera, ejecutar:

```bash
npm run verify:git-control-backend-policy
```

## Decisiones relacionadas
La planificación inicial vive en `openspec/phase-12-3e-server-only-migration-plan.md`, el diseño específico de Skills BFF vive en `openspec/phase-12-3g-skills-bff-design.md`, la implementación vive en `openspec/phase-12-3h-skills-bff-implementation.md`, Vault vive en `openspec/phase-12-4-vault-readonly-api.md` y Health/Dashboard en `openspec/phase-12-5-health-dashboard-aggregation.md`.

Resumen de la decisión:
- `/mugiwaras` ya migró en Phase 12.3f porque era server component, dinámico y no necesitaba browser fetch directo.
- `/skills` migró en Phase 12.3h con route handlers BFF same-origin porque es client component y contiene preview/update controlados.
- Ese BFF usa `MUGIWARA_CONTROL_PANEL_API_URL` solo en servidor, no es proxy abierto, valida entradas críticas, usa `cache: no-store` y devuelve errores saneados.
- FastAPI sigue siendo la fuente de verdad para allowlist, path safety, stale hash, edición y auditoría.


## Git control backend — 40.3 commit detail + safe diff
- La superficie Git sigue siendo backend-only/read-only y deny-by-default.
- El cliente opera únicamente con `repo_id` allowlisteado y SHA completo devuelto por el backend; no se aceptan paths, refs, rangos, revspecs ni comandos.
- Los diffs históricos se tratan como sensibles: paths `.env`/credenciales/logs/dumps/DBs y binarios se omiten, contenido con tokens o rutas host se redacta y todas las salidas se truncan por fichero/total.
- El cuerpo libre de commit no forma parte del contrato público; solo se lee internamente para trailers allowlisteados.

## Git control frontend / Repos Git
Issue #40.4 añade la ruta frontend `/git` con etiqueta visible `Repos Git`. La página es una Server Component dinámica y consume el backend solo desde `apps/web/src/modules/git/api/git-http.ts` con `import 'server-only'` y `MUGIWARA_CONTROL_PANEL_API_URL`. Issue #40.5 añade `Selección controlada` repo/commit mediante enlaces server-side y validación estricta de `searchParams`.

Reglas de runtime:
1. El navegador no recibe ni usa `MUGIWARA_CONTROL_PANEL_API_URL`, `NEXT_PUBLIC_*` ni backend URL absoluta.
2. La UI no acepta paths, URLs, remotes, refs, rangos, revspecs ni comandos Git desde cliente; usa solo `repo_id` y SHA completo devueltos por backend.
3. `repo_id` solo se acepta si existe en `repoIndex.repos`, y `sha` solo si existe en `commits.commits` del repo seleccionado; query params inválidos se ignoran sin eco ni error crudo.
4. La página muestra índice de repos, commits, ramas locales, detalle de commit y diff histórico saneado. No muestra working-tree diff en 40.4/40.5.
5. El fallback local está saneado y no renderiza rutas host, detalles internos de ejecución y errores crudos, errores crudos, tokens ni secretos.
6. Antes de cerrar cambios sobre esta frontera ejecutar:

```bash
npm run verify:git-server-only
```

Nota 40.4: el contenido de líneas del diff se omite en frontend; la UI muestra metadata, contadores y estados de redacción/truncado/omisión para evitar reintroducir canarios o secretos históricos en HTML/DOM. Guardrail: `npm run verify:git-server-only`.

# Configuración runtime del control plane

## Principio
El control plane distingue entre configuración pública de frontend y configuración privada de servidor.

- Las variables `NEXT_PUBLIC_*` pueden acabar embebidas en bundles cliente y solo deben usarse para valores no sensibles que el navegador pueda conocer.
- Las variables sin prefijo `NEXT_PUBLIC_` deben leerse solo desde server loaders, adapters server-only o backend.
- Cualquier URL o ruta que revele topología interna debe preferir configuración server-only cuando la página pueda cargar los datos desde servidor.

## Variables actuales

| Variable | Consumidor | Exposición | Uso |
| --- | --- | --- | --- |
| `MUGIWARA_CONTROL_PANEL_API_URL` | `/memory`, `/mugiwaras` server loaders | Server-only | Base URL del backend para superficies read-only que pueden cargar desde servidor. |
| `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` | `/skills` | Pública/cliente | Base URL histórica para la superficie Skills hasta que tenga frontera BFF/server-side propia. |

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

## Pendiente deliberado
`/skills` sigue usando `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` por compatibilidad con fases previas.

La planificación de migración vive en `openspec/phase-12-3e-server-only-migration-plan.md`.

Resumen de la decisión:
- `/mugiwaras` ya migró en Phase 12.3f porque era server component, dinámico y no necesitaba browser fetch directo.
- `/skills` requiere fase propia de diseño/implementación porque hoy es client component y contiene preview/update controlados; debe pasar por una frontera server-side tipo BFF/route handlers o server actions sin debilitar la política FastAPI.
- La migración de `/skills` debe llevar revisión de Chopper + Franky.

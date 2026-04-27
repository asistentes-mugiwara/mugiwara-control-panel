# Issue #36.2 — Frontend server-only adapter + header integration

## Estado
- **Fase:** 36.2 — frontend server-only adapter + header integration.
- **Rama:** `zoro/issue-36-2-system-metrics-header`.
- **Issue:** #36 Always-visible header system metrics.
- **Base previa:** PR #85 / 36.1 backend-only, ya mergeada.

## Objetivo
Consumir `GET /api/v1/system/metrics` desde un adapter server-only de Next.js e integrar RAM, disco y uptime en el header global (`AppShell`/`Topbar`) siempre visible.

## Diseño aplicado
1. `apps/web/src/modules/system/api/system-metrics-http.ts`:
   - `import 'server-only'`;
   - env privada `MUGIWARA_CONTROL_PANEL_API_URL`;
   - validación `http:`/`https:`;
   - endpoint fijo `/api/v1/system/metrics`;
   - `cache: 'no-store'`;
   - errores por código interno, nunca mensajes raw renderizados.
2. `apps/web/src/app/layout.tsx`:
   - `export const dynamic = 'force-dynamic'`;
   - carga snapshot server-side;
   - convierte errores a snapshot degradado con `—`;
   - pasa props serializables a `AppShell`.
3. `AppShell`/`Topbar`:
   - siguen como client components por navegación mobile;
   - no hacen fetch ni leen env;
   - renderizan RAM, disco y uptime con jerarquía compacta.
4. Responsive:
   - desktop muestra porcentaje + usado/total cuando cabe;
   - tablet oculta detalle usado/total para no saturar;
   - mobile usa tres chips en grid, sin command chip, con el header apilado sin overflow horizontal.

## Decisiones explícitas
- Sin `NEXT_PUBLIC_*`.
- Sin fetch browser directo al backend.
- Sin exponer backend URL, paths host, errores crudos, stack traces ni payloads internos.
- Sin polling, cache/TTL ni refresh cliente en esta fase; por tanto Franky no es reviewer obligatorio salvo que se añada esa capacidad en fase posterior.

## Verify esperado
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build`.
- `npm run verify:visual-baseline`.
- `PYTHONPATH=. pytest apps/api/tests/test_system_metrics_api.py -q`.
- Smoke HTML/DOM contra fugas: backend URL, `NEXT_PUBLIC`, paths internos, raw errors.
- `git diff --check`.

## Review
- Usopp: header visible, jerarquía, responsive desktop/tablet/mobile y ruido visual.
- Chopper: server-only boundary, no-leakage, ausencia de URL backend/env pública/raw errors en cliente.
- Franky: no solicitado en esta fase porque no hay polling/cache/TTL/runtime nuevo.

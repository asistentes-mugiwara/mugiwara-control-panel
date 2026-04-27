# Issue #36.3 — system metrics closeout

## Scope
Closeout final de #36: guardrail server-only frontend, docs/canon y cierre del issue tras 36.1 backend + 36.2 header ya mergeados.

## Invariants fixed
- Backend endpoint fijo `GET /api/v1/system/metrics`.
- Frontend adapter `server-only` con `MUGIWARA_CONTROL_PANEL_API_URL`.
- `RootLayout` dinámico carga snapshot server-side.
- `AppShell`/`Topbar` no hacen fetch ni leen env.
- Sin `NEXT_PUBLIC_*`, backend URL ni errores crudos en cliente.
- Sin polling/cache/TTL.

## Verify
Completado antes de PR: nuevo `verify:system-metrics-server-only`, `verify:system-metrics-backend-policy`, `verify:perimeter-policy`, `verify:healthcheck-source-policy`, web typecheck/build, visual baseline, backend/perimeter tests, smoke live/invalid-config/browser anti-fugas y `git diff --check`.

## Review plan
Chopper + Usopp. Franky no es obligatorio porque 36.3 no introduce polling/cache/TTL ni cambia fuente runtime; solo fija guardrails/canon sobre 36.1/36.2.

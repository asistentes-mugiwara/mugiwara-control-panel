# Issue #36.2 — frontend server-only adapter + header integration

## Scope
- Adapter frontend server-only para `GET /api/v1/system/metrics`.
- Snapshot server-side desde root layout dinámico.
- Header global con RAM, disco y uptime visibles en `Topbar`.
- Responsive desktop/tablet/mobile sin fetch de navegador ni env pública.

## Boundary
- No `NEXT_PUBLIC_*`.
- No browser fetch al backend interno.
- No backend URL ni raw errors renderizados.
- No polling/cache/TTL en esta fase.

## Verify
Pendiente de completar antes de PR: typecheck, build, visual baseline, backend test, smoke HTML/DOM anti-fugas y `git diff --check`.

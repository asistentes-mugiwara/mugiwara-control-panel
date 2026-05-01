# Issue #127 — Closeout técnico

## Contexto
Pablo activó la implementación de #127: sustituir el concepto visible de Dashboard por una página Inicio en `/`, sin sidebar y con cards de navegación a las superficies principales.

## Corte decidido
Microfase única porque el cambio es homogéneo: frontend visible, shell/navegación y docs mínimas. No toca backend, endpoints, datos sensibles, dependencias ni escritura.

## Implementación
- `/` renderiza Inicio como portada privada con marca Mugiwara/Laya y cards hacia Mugiwaras, Skills, Memory, Vault, Healthcheck, Repos Git y Uso.
- `/dashboard` queda como alias temporal con `redirect('/')` para no romper enlaces antiguos.
- `AppShell` detecta `/` y oculta `SidebarNav`; `Topbar` recibe `showNavigation` para ocultar el botón móvil de menú lateral en Inicio.
- La navegación lateral interna mantiene `Inicio` como primera entrada apuntando a `/`.
- Se añadió `verify:home-navigation` para fijar el contrato estático de issue #127.
- Docs actualizadas para que Dashboard deje de ser la home canónica y `Inicio` sea la entrada privada.

## Verify ejecutado
- `npm run verify:laya-mugiwara-brand` — PASS.
- `npm run verify:home-navigation` — PASS.
- `npm --prefix apps/web run typecheck` — PASS.
- `npm run verify:visual-baseline` — PASS checklist generada con `/ — Inicio`.
- `git diff --check` — PASS.
- `npm --prefix apps/web run build` — PASS.
- Smoke local con `next start` en `127.0.0.1:3027`:
  - `/` devuelve 200, contiene Inicio/cards y no contiene sidebar ni Dashboard visible.
  - `/dashboard` redirige/resuelve a `/` y devuelve Inicio.
  - `/mugiwaras` mantiene sidebar interna.
- Browser snapshot de `/`: portada Inicio con marca, cards principales y sin errores de consola. La herramienta de vision capturó screenshot pero falló el análisis por error de import local; el snapshot/console cubren la comprobación funcional.

## Riesgos residuales
- Al ser cambio UI visible, requiere revisión de Usopp antes de merge.
- Tras merge de cambio visible, reconstruir/reiniciar el servicio web persistente antes de que Pablo lo valide por Tailscale/móvil.

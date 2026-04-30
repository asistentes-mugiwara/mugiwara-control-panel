# Issue #127 — Dashboard como página Inicio

## Objetivo
Convertir `/` en una página **Inicio** visual y navegable para el Mugiwara Control Panel, dejando de tratar Dashboard como agregador operativo visible.

## Decisión de alcance
Esta microfase sí implementa el cambio pedido por Pablo en #127 porque la orden actual es “Ponte con el issue 127”.

## Principios
- `/` muestra Inicio directamente.
- Inicio no renderiza sidebar ni botón de navegación lateral.
- `/dashboard` queda como alias temporal mediante redirect a `/`.
- Las páginas internas mantienen sidebar y añaden **Inicio** como primera entrada.
- Inicio no duplica métricas ni estados de Healthcheck/Usage/Git/Memory/Vault/Skills/Mugiwaras.
- Sin nuevas superficies de escritura, backend, endpoints ni assets pesados.

## Entregables
1. Guardrail estático `verify:home-navigation` que fije el contrato de navegación/home.
2. Página `/` con banner, descripción breve y cards para Mugiwaras, Skills, Memory, Vault, Healthcheck, Repos Git y Uso.
3. AppShell capaz de ocultar sidebar/topbar menu en Inicio y conservarlos en rutas internas.
4. Redirect `/dashboard -> /`.
5. Docs vivas mínimas actualizadas para sitemap/shell.

## Fuera de alcance
- Métricas nuevas o agregaciones transversales.
- Cambios backend/API Dashboard.
- Reescritura profunda de docs históricas de observabilidad.
- Nuevos assets versionados.

## Verify esperado
- RED/GREEN de `npm run verify:home-navigation`.
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build`.
- `npm run verify:visual-baseline` actualizado para `/`.
- `git diff --check`.
- Smoke HTTP/DOM local de `/`, `/dashboard` y una ruta interna confirmando sidebar donde toca.

## Review
Cambio frontend visible y navegación: Usopp obligatorio. Chopper no es necesario salvo que aparezca superficie de datos nueva; no aparece. Franky no es necesario salvo runtime/deploy; no aparece.

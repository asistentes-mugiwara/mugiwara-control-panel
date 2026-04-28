# Issue 117 — Laya Mugiwara brand closeout

## Decisión
`laya-mugiwara` pasa a ser la marca visual general del panel privado: SVG para favicon/app icon y JPG para `PageHeader`.

## Frontera preservada
Los assets quedan como dependencia local privada bajo `apps/web/public/assets/brand/`, carpeta ignorada por `.gitignore`. No se fuerza su versionado en el repo público.

## Implementación
- `PageHeader` renderiza `LayaMugiwaraMark` y ya no acepta `mugiwaraSlug` para cabeceras generales.
- Las crests de Mugiwara se conservan en `/mugiwaras` y selectores/contextos de agente.
- Guardrail `verify:laya-mugiwara-brand` fija metadata, PageHeader, ausencia de `mugiwaraSlug` en headers generales y no tracking de assets privados.

## Verify
Completado en la rama `zoro/issue-117-laya-mugiwara-brand` antes de PR:
- `npm run verify:laya-mugiwara-brand`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:visual-baseline`
- `git diff --check`
- smoke browser production local en `/dashboard`, `/healthcheck`, `/skills`, `/usage`, `/mugiwaras` con consola limpia, sin overflow horizontal y header usando `/assets/brand/laya-mugiwara.jpg`.

# Issue 117 — Laya Mugiwara brand

## Objetivo
Usar `laya-mugiwara` como marca visual principal del panel privado sin convertir los assets personales en parte del repo público.

## Alcance
- `apps/web/src/app/layout.tsx` declara el favicon/app icon mediante `apps/web/public/assets/brand/laya-mugiwara.svg`.
- `PageHeader` usa el emblema general `apps/web/public/assets/brand/laya-mugiwara.jpg` mediante un componente compartido de marca.
- Los `PageHeader` de rutas generales dejan de recibir `mugiwaraSlug`; las crests por Mugiwara quedan para `/mugiwaras` y contextos de agente como selectores/cards.
- `.gitignore` mantiene `apps/web/public/assets/brand/` ignorado.
- Se añade guardrail `npm run verify:laya-mugiwara-brand` para fijar la política de marca/assets privados.

## Fuera de alcance
- Rediseño global del shell.
- Cambios backend/runtime/deploy.
- Versionar assets privados o forzar `git add -f`.
- Reemplazar crests en cards/selectores de Mugiwara.

## Política de assets
Los assets `laya-mugiwara.svg` y `laya-mugiwara.jpg` son dependencia local/privada del runtime. El repo público documenta las rutas, pero no debe trackear esos binarios salvo orden explícita de Pablo.

## Verify esperado
- `npm run verify:laya-mugiwara-brand`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:visual-baseline`
- `git diff --check`
- smoke browser `/dashboard`, `/healthcheck`, `/skills`, `/usage`, `/mugiwaras`

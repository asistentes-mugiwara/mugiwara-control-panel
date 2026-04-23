# Phase 10.4 — thematic identity in details

## Scope
Reforzar la identidad Mugiwara del frontend con detalles ligeros y consistentes: crests, acentos cromáticos, labels y microcopy, sin introducir fondos recargados ni fanart invasivo.

## Decisions
- `PageHeader` se amplía con crest contextual y pills de detalle por página.
- `SurfaceCard` gana `eyebrow` y `accent` para expresar identidad temática con barras/acento sutil y labels curados.
- La identidad se reparte por módulos: dashboard, mugiwaras, memory, skills, vault y healthcheck.
- Los cambios son intencionadamente sobrios: mejor semántica visual y tono, no decoración pesada.
- No se tocan flujos funcionales ni se abren nuevas superficies de edición.

## Definition of done
- cada pantalla principal tiene detalles Mugiwara visibles pero sobrios.
- la identidad vive en headers, labels, acentos y microcopy, no en fondos gigantes.
- las cards clave comunican mejor su rol con `eyebrow` y acento cromático controlado.
- el shell mantiene claridad operativa por encima del adorno.

## Verify expected
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`

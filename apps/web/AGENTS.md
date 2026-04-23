# AGENTS.md — apps/web

## Rol
Frontend Next.js del control plane.

## Reglas
- La UI representa el sistema; no decide la seguridad.
- Priorizar UX clara para lectura y edición controlada de skills.
- **Vigilar `.gitignore`**: no versionar `.next`, caches, variables locales ni artefactos de build.
- Mantener documentación y este `AGENTS.md` actualizados si cambia la estructura de rutas o features.
- Tratar `docs/frontend-ui-spec.md` como referencia obligatoria para layout, sitemap, componentes y wireframes del MVP.
- Tratar `docs/frontend-implementation-handoff.md` como referencia obligatoria para estructura de carpetas, tokens, componentes base y organización de assets.
- No introducir una landing separada, no mezclar `memory` con `vault` y no ampliar superficies de escritura fuera de `skills` sin decisión explícita documentada.

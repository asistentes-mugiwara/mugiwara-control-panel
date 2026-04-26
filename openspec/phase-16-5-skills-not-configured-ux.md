# Phase 16.5 — Skills not-configured UX (#46)

## Objetivo
Cerrar la issue #46 con una microfase UI-only sobre `/skills`: cuando la fuente Skills no está configurada o está degradada, la página debe explicar una única causa raíz dominante, no pedir seleccionar una skill inexistente y mantener la información de seguridad como contexto secundario.

## Decisión de corte
No se divide en fases más pequeñas.

Motivo: el alcance real es homogéneo y pequeño:
- una ruta frontend (`apps/web/src/app/skills/page.tsx`),
- copy/jerarquía visual de estados,
- documentación viva de estados/UI,
- sin backend, runtime, dependencias, API, permisos ni seguridad efectiva nueva.

Dividirlo más aumentaría coordinación y PRs sin reducir riesgo. Sí se mantiene como microfase independiente de futuras ampliaciones de Skills editing.

## Alcance incluido
- Panel raíz dominante para `not_configured` / error de fuente.
- Evitar copy de selección cuando el catálogo no existe.
- Reducir repetición de la misma causa raíz en catálogo, editor y preview/auditoría.
- Dejar frontera BFF/security visible pero secundaria.
- Actualizar docs frontend relevantes.

## Fuera de alcance
- Nuevos endpoints backend.
- Cambios de allowlist o escritura.
- Settings page o configuración desde UI.
- Cambios de seguridad/BFF, CORS, Origin/CSRF o runtime config.
- Rediseño general de Skills.

## Definition of done
- `not_configured` muestra primero una explicación raíz clara.
- La UI no pide seleccionar una skill cuando el catálogo no está disponible.
- Los paneles secundarios no repiten ruidosamente el mismo mensaje técnico.
- La edición productiva solo domina cuando hay skill real cargada.
- Seguridad/frontera sigue visible sin dominar el fallo de conexión.
- Issue #46 puede cerrarse con review Usopp.

## Verify esperado
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:visual-baseline` incluyendo `/skills`
- `git diff --check`
- smoke visual/browser de `/skills` si la app puede levantarse localmente.

## Review
- Reviewer principal: Usopp por jerarquía UX/copy.
- Chopper no es obligatorio porque no se cambia config/error plumbing ni superficie de seguridad; escalar solo si aparece leakage o modificación de BFF.

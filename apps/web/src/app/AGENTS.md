# AGENTS.md — apps/web/src/app

## Rol
Shell de la aplicación, rutas, layouts y composición global del frontend.

## Reglas
- No meter lógica de negocio profunda aquí.
- Mantener navegación principal alineada con el modelo de producto.
- **Vigilar `.gitignore`** y no colar outputs locales.
- Actualizar documentación cuando cambien rutas principales o la IA de navegación.
- La navegación principal y los wireframes base del shell se definen en `docs/frontend-ui-spec.md`; respetarlos y actualizarlos cuando cambie cualquier ruta o composición global.
- La traducción de esa spec a rutas, shell, componentes y assets se apoya en `docs/frontend-implementation-handoff.md`.

# AGENTS.md — apps/api/src/app

## Rol
Composición de la aplicación: bootstrap, configuración, wiring, routers globales y políticas transversales.

## Reglas
- No meter lógica de dominio aquí.
- Centralizar configuración segura y composición de dependencias.
- **Vigilar `.gitignore`** para no versionar configuraciones locales o temporales.
- Actualizar documentación cuando cambie el arranque de la app o el wiring global.

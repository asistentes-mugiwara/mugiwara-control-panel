# Versionado de contratos — fase 4

## Regla general
`packages/contracts` debe versionarse semánticamente a nivel de contrato compartido, aunque el monorepo avance junto.

## Cambios no breaking
Considerar no breaking:
- añadir campos opcionales
- añadir nuevos recursos sin romper contratos existentes
- ampliar enums si el consumidor no dependía de exhaustividad cerrada
- añadir metadata opcional

## Cambios breaking
Considerar breaking:
- renombrar campos
- eliminar campos
- cambiar tipos
- mover datos entre `data` y `meta`
- cambiar semántica de estados/errores

## Estrategia propuesta
- mantener `v1` implícita mientras no exista implementación pública dura
- cuando empiece implementación real, documentar una tabla de cambios del contrato
- marcar explícitamente en docs cualquier cambio incompatible

## Reglas de sincronización
Si cambia un contrato compartido, revisar en el mismo cambio:
- backend (`apps/api`)
- frontend (`apps/web`)
- docs de fase y verify checklist
- AGENTS de `packages/contracts` si cambia su responsabilidad

# Estados frontend — fase 3

## Contrato de estados por módulo
Cada vista del frontend debe contemplar al menos:
- `loading`
- `ready`
- `empty`
- `error`
- `stale` cuando aplique frescura temporal

## Reglas
- `loading` no debe bloquear navegación completa del shell si solo falla un módulo.
- `error` debe ser visible sin filtrar detalles internos del host.
- `empty` debe distinguir “sin datos”, “sin permiso” y “fuente no configurada”.
- Si una página muestra fixture, fallback o snapshot visible, no debe presentarlo como simple “Sin datos”: debe etiquetarlo como `Modo fallback local`, `Snapshot saneado` y/o `No tiempo real`.
- Códigos técnicos como `not_configured` pueden mostrarse como detalle secundario (`Estado técnico: ...`), nunca como explicación principal para el usuario.
- `stale` aplica a healthcheck, system y cualquier dato con timestamp operativo.

## Por módulo
### Dashboard
- `loading`: placeholders de tarjetas y estado general
- `ready`: resumen operativo y accesos
- `empty`: no aplica salvo módulos internos sin fuentes aún
- `error`: fallo de agregación sin romper el shell
- `stale`: datos de salud con timestamp antiguo

### Mugiwaras
- `empty`: ningún agente activo visible
- `error`: fallo al cargar la ficha o el índice

### Skills
- `not_configured`: la primera señal visible debe explicar que falta `MUGIWARA_CONTROL_PANEL_API_URL` en runtime server; catálogo, detalle, preview y guardado quedan bloqueados sin pedir seleccionar una skill.
- `empty`: sin skills en la categoría/filtro con API real conectada.
- `error`: fallo de listado o detalle; mostrar una causa raíz saneada y mantener catálogo/editor/preview como estados secundarios, sin repetir el diagnóstico en cada zona.
- `ready`: detalle editable solo si el backend lo autoriza.
- En `not_configured` o error raíz, la información de BFF/frontera sigue visible como contexto secundario: no debe dominar la acción requerida ni exponer URL interna del backend.

### Memory
- `empty`: memoria no inicializada para ese agente
- `error`: fuente no accesible o resumen no disponible

### Vault
- `empty`: índice vacío o no generado
- `error`: fallo de navegación/lectura

### Healthcheck
- `stale`: healthchecks o cron con frescura fuera del umbral
- `error`: fuente de estado no disponible
- La vista debe separar explícitamente `Estado actual`, `Causa actual` y `Bitácora histórica`.
- Cuando haya `En revisión`, el usuario debe ver la causa primaria (`summary_bar.current_cause`, por ejemplo `Project health`) antes de la bitácora.
- La bitácora muestra eventos históricos saneados y no debe presentarlos como incidencias activas.
- La vista debe priorizar visualmente `fail`, `high` y `critical` antes que checks sanos.
- Cuando haya degradación, debe existir una señal superior de `Causa actual`, `Acción requerida` o prioridad actual sin añadir controles operativos.
- Los badges de estado/severidad no deben duplicar el mismo significado visual; si coinciden, se muestra un solo badge y la severidad queda como texto de apoyo.

## Contratos frontend esperados del backend
- listas resumidas para navegación
- detalles tipados por recurso
- timestamps de actualización para módulos operativos
- códigos/estados semánticos, no solo strings libres

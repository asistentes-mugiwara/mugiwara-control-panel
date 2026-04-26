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
- `empty`: sin skills en la categoría/filtro
- `error`: fallo de listado o detalle
- `ready`: detalle editable solo si el backend lo autoriza

### Memory
- `empty`: memoria no inicializada para ese agente
- `error`: fuente no accesible o resumen no disponible

### Vault
- `empty`: índice vacío o no generado
- `error`: fallo de navegación/lectura

### Healthcheck
- `stale`: healthchecks o cron con frescura fuera del umbral
- `error`: fuente de estado no disponible
- La vista debe priorizar visualmente `fail`, `high` y `critical` antes que checks sanos.
- Cuando haya degradación, debe existir una señal superior de `Acción requerida` o prioridad actual sin añadir controles operativos.
- Los badges de estado/severidad no deben duplicar el mismo significado visual; si coinciden, se muestra un solo badge y la severidad queda como texto de apoyo.

## Contratos frontend esperados del backend
- listas resumidas para navegación
- detalles tipados por recurso
- timestamps de actualización para módulos operativos
- códigos/estados semánticos, no solo strings libres

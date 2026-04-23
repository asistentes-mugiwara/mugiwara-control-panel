# Auditoría y trazabilidad de edición de skills

## Objetivo
Definir cómo debe quedar trazada cualquier edición permitida de skills en el MVP.

## Qué debe quedar auditado
Cada operación de guardado debe registrar como mínimo:
- `timestamp`
- `actor`
- `skill_id`
- `repo_path` resuelto por backend
- hash o fingerprint previo
- hash o fingerprint posterior
- resumen del diff
- resultado (`success` / `rejected` / `failed`)
- motivo de rechazo si aplica

## Dónde vive la auditoría
En el MVP, la auditoría debe exponerse como registro de aplicación o datastore controlado por backend.

No debe depender solo de:
- historial visual del navegador
- memoria del agente
- diffs no persistidos
- mensajes efímeros del chat

## Requisitos mínimos de UX
La UI debe mostrar:
- skill afectada
- fecha/hora
- actor
- diff resumido
- estado de la operación

## Relación con Git
Git puede ser una capa posterior de trazabilidad, pero no sustituye la auditoría operacional del backend.

Motivos:
- puede haber guardados rechazados que no llegan a commit
- puede haber varios cambios antes de una consolidación en Git
- la auditoría debe existir incluso si la política de commit no es inmediata

## Política de diff
- diff textual limitado y legible
- sin exponer secretos ni blobs arbitrarios
- truncado seguro si el cambio es demasiado grande
- indicación clara de secciones afectadas

## Rechazos obligatorios
Debe rechazarse la operación si:
- la skill no está en allowlist
- el path resuelto sale del árbol permitido
- el contenido supera límites definidos
- el formato no pasa validación mínima
- existe conflicto de versión/fingerprint

## Señales para fases futuras
No implementar ahora, pero dejar previstas:
- revisión de cambios antes de guardar
- control de concurrencia optimista
- versionado por revisión
- integración con commit semántico controlado

## Conclusión
Sin trazabilidad explícita no hay edición segura de skills. En este MVP, editar skills solo es aceptable si cada cambio queda auditado por backend con metadata suficiente para revisar quién cambió qué y cuándo.

# Superficie de skills en el MVP

## Objetivo
Definir la única superficie editable del MVP del `mugiwara-control-panel` sin romper el modelo read-only del resto del sistema.

## Principio rector
Todo el panel es de lectura por defecto salvo una única escritura permitida y acotada: la edición controlada de skills autorizadas.

## Alcance exacto
La superficie de escritura permitida se limita a ficheros `SKILL.md` autorizados dentro de una allowlist explícita mantenida por backend.

### Escritura permitida
- actualizar contenido de `skills-source/**/SKILL.md` para skills explícitamente autorizadas
- leer metadatos necesarios para mostrar diff, validación y trazabilidad

### Escritura no permitida
- crear archivos arbitrarios fuera de la allowlist
- editar `.env`, secretos, config del sistema o ficheros del runtime no autorizados
- modificar vault, Engram DB, memoria built-in o Honcho desde esta superficie
- tocar código de producto, scripts o artefactos fuera del subconjunto de skills permitido
- borrar skills sin política explícita adicional

## Modelo de acceso
La UI nunca escribe directamente en filesystem.

Flujo objetivo:
1. UI solicita edición de una skill autorizada
2. backend valida identidad, ámbito y allowlist
3. backend resuelve ruta canónica permitida
4. backend valida payload, tamaño, formato y política editorial
5. backend aplica cambio de forma auditable
6. backend devuelve resultado, diff resumido y metadata de trazabilidad

## Allowlist mínima
La allowlist debe estar gobernada por backend y no por el cliente.

Campos mínimos por entrada:
- `skill_id`
- `display_name`
- `repo_path`
- `owner_scope`
- `editable_sections` si se quiere granularidad futura
- `public_repo_risk`

## Reglas de seguridad
- deny-by-default en backend
- resolución de rutas por identificador interno, no por path libre del cliente
- normalización y validación anti path traversal
- rechazar symlinks, rutas relativas peligrosas o destinos fuera del árbol autorizado
- validar tamaño, encoding y estructura esperada del `SKILL.md`
- mantener diff visible antes y después del cambio
- no permitir bulk writes ni operaciones compuestas en MVP

## Estados del módulo
- `ready`: skill cargada y editable
- `forbidden`: skill fuera de allowlist o actor sin permiso
- `not_configured`: allowlist o fuente no disponible
- `validation_error`: payload inválido
- `source_unavailable`: repo/ruta no accesible
- `stale`: vista desactualizada respecto al origen

## Contrato con frontend
El frontend solo necesita:
- lista de skills editables
- detalle de una skill editable
- preview de diff
- resultado del guardado
- historial/auditoría resumida

No necesita acceso libre al árbol de directorios.

## Riesgos vigilados
- expansión de la superficie de escritura a otras entidades por comodidad
- usar paths libres enviados por cliente
- permitir escritura masiva o acciones no auditables
- confundir edición de skills con gestión global del runtime

## Conclusión
La superficie de skills del MVP debe ser pequeña, explícita y auditable. Si una necesidad futura requiere escribir fuera de esta allowlist, debe tratarse como cambio de scope y no como extensión silenciosa de esta fase.

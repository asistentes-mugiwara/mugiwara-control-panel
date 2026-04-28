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

## Allowlist de catálogo
La allowlist debe estar gobernada por backend y no por el cliente.

El catálogo visible se descubre desde rutas backend-owned bajo `/srv/crew-core/skills-source`:
- `global/*/SKILL.md` como skills globales compartidas.
- `agents/<mugiwara>/*/SKILL.md` como skills propias de cada Mugiwara allowlisteado.
- referencias runtime explícitas, como `judgment-day`, pueden exponerse como editables si viven bajo el runtime root allowlisteado (`~/.config/opencode/skills`).

Campos mínimos por entrada:
- `skill_id` estable generado por backend (`global-<skill>` o `agent-<mugiwara>-<skill>`)
- `display_name`
- `repo_path`
- `owner_scope`
- `owner_slug`
- `owner_label`
- `editable`
- `shareable_label` derivada en UI desde la señal backend `public_repo_risk`: bajo → `Skill compartible: Sí (sin riesgo)`; medio/alto → `Skill compartible: No (riesgo de filtrado)`.

La página `/skills` debe evitar listados largos por defecto. El flujo de lectura/edición es:
1. seleccionar una fuente (`global` o un Mugiwara allowlisteado);
2. elegir una skill de esa fuente en un desplegable filtrado;
3. abrir una única ventana de trabajo para esa skill;
4. alternar entre modo lector y modo editor.

El modo lector debe renderizar Markdown de forma legible. El modo editor conserva la escritura controlada mediante BFF same-origin y backend allowlist. No deben reintroducirse contenedores informativos sin acción directa que compitan con el selector y la ventana de trabajo.

Decisión operativa: colocar una skill nueva bajo `skills-source/global`, `skills-source/agents/<mugiwara>` o el runtime root allowlisteado la incorpora al catálogo editable del panel si cumple el contrato `SKILL.md` y el slug de Mugiwara está allowlisteado. Las skills globales se editan con dueño/actor visible `luffy`; las skills de agente usan su `owner_slug`; las runtime usan `runtime` salvo política posterior más granular. Si una skill debe quedar fuera de edición, debe retirarse de esta superficie hasta que exista política granular.

### Copy de edición
- Todas las skills visibles se presentan como `Editable`.
- La UI no muestra `Riesgo repo público`; usa `Skill compartible: Sí (sin riesgo)` o `Skill compartible: No (riesgo de filtrado)`.
- El actor visible no se introduce a mano: lo calcula el frontend desde el dueño de la skill y lo envía al backend para auditoría.

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
- lista de skills visibles y editables
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

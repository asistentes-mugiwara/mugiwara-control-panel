# Phase 19.1 — Skills globales + selector Mugiwara

## Objetivo
Corregir la superficie `/skills` para que no quede anclada a Zoro: debe permitir seleccionar cualquier Mugiwara y mostrar las skills globales junto con las skills propias del Mugiwara seleccionado.

## Problema observado
- Desde `/mugiwaras`, los enlaces `Ver Skills` apuntaban siempre a `/skills` sin contexto de agente.
- `/skills` consumía un catálogo backend mínimo/hardcoded y el primer elemento efectivo era Zoro.
- Pablo espera un catálogo operativo por Mugiwara: global + seleccionado.

## Decisiones
- Backend Skills descubre catálogo desde rutas backend-owned bajo `/srv/crew-core/skills-source`:
  - `global/*/SKILL.md` -> `owner_scope=shared`, `owner_slug=global`.
  - `agents/<mugiwara>/*/SKILL.md` -> `owner_scope=agent`, `owner_slug=<mugiwara>`.
  - referencias runtime explícitas quedan `read-only`.
- `skill_id` pasa a ser estable y namespaceado: `global-<skill>` y `agent-<mugiwara>-<skill>` para evitar colisiones entre agentes.
- `/mugiwaras` enlaza a `/skills?mugiwara=<slug>`.
- `/skills` conserva la frontera BFF same-origin y filtra en cliente solo sobre datos ya allowlisteados por backend.

## Fuera de alcance
- Crear/borrar skills.
- Navegación libre por filesystem.
- Editar ficheros fuera de `SKILL.md` bajo el árbol allowlisted.
- Permisos por usuario/auth real.
- Rediseño completo de la página Skills.

## Definition of Done
- Catálogo backend incluye globales y skills de varios Mugiwaras.
- Contrato expone `owner_slug` y `owner_label`.
- Selector visual en `/skills` permite cambiar Mugiwara.
- El catálogo visible combina global + Mugiwara seleccionado.
- Links desde `/mugiwaras` conservan contexto por query param.
- Verify backend, BFF, typecheck, build y browser smoke pasan.

## Review esperada
Cambio mixto backend/filesystem allowlisted + UI visible. Review requerida: Chopper + Usopp. Franky solo si se modifica runtime/servicios, que queda fuera de esta fase.

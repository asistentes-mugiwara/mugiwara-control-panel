# Phase 19.1 closeout — Skills globales + selector Mugiwara

## Contexto
Pablo detectó que la página `/skills` parecía fija en Zoro y que desde `/mugiwaras` cualquier enlace `Ver Skills` acababa mostrando de nuevo la selección de Zoro. El comportamiento correcto es seleccionar Mugiwara y ver skills globales + skills propias del seleccionado.

## Implementado
- Backend Skills sustituye el catálogo mínimo hardcoded por descubrimiento allowlisted bajo `/srv/crew-core/skills-source`.
- Las entradas de catálogo incluyen `owner_slug` y `owner_label` para distinguir globales, agente y runtime.
- `skill_id` queda namespaceado (`global-*`, `agent-<slug>-*`, `runtime-*`) para evitar colisiones entre skills con el mismo nombre en varios agentes.
- `/mugiwaras` enlaza ahora a `/skills?mugiwara=<slug>`.
- `/skills` añade selector de Mugiwara y filtra catálogo visible como `global + seleccionado`.

## Verify ejecutado
- `PYTHONPATH=. pytest apps/api/tests/test_skills_api.py apps/api/tests/test_mugiwaras_api.py -q`
- `python -m py_compile apps/api/src/modules/skills/domain.py apps/api/src/modules/skills/service.py apps/api/src/modules/mugiwaras/service.py`
- `npm run verify:skills-server-only`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- Browser smoke local en `/skills?mugiwara=franky`, `/skills?mugiwara=chopper` y `/mugiwaras`.

## Riesgos y límites
- Se amplía el catálogo editable a todos los `SKILL.md` bajo `skills-source/global` y `skills-source/agents/<mugiwara>` allowlisteados por slug. Sigue sin aceptar paths cliente ni escritura fuera del árbol permitido.
- La edición sigue siendo controlada por fingerprint/actor/auditoría, pero no hay auth por usuario todavía.
- Runtime skills fuera de `skills-source` se mantienen como referencia read-only.

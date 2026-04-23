# Phase 2 — verify checklist

## Checklist funcional
- [ ] `apps/api` queda definido como frontera deny-by-default
- [ ] Los módulos backend del MVP están delimitados
- [ ] Solo `skills` conserva escritura permitida en MVP
- [ ] `vault` mantiene módulo propio
- [ ] `memory` no absorbe `vault` ni `engram`

## Checklist de seguridad
- [ ] Existen allowlists iniciales de lectura documentadas
- [ ] La escritura prohibida en MVP está documentada
- [ ] No se introduce acceso arbitrario al filesystem
- [ ] Se recuerda vigilar `.gitignore` por tratarse de repo público

## Checklist documental
- [ ] `docs/development.md` sigue siendo coherente con el roadmap
- [ ] Los nuevos docs se alinean con `AGENTS.md`
- [ ] La fase deja claro cuándo usar `judgment-day`

## Incidencia de runtime observada
- En la ejecución de OpenCode para esta fase, `sdd-init-zoro` quedó bloqueado sin producir artefactos finales dentro del timeout externo.
- Se aplicó la política de recuperación acordada: reintento una vez y, ante nueva imposibilidad de cierre fiable del flujo completo desde Hermes, continuación inline de la fase documental.
- Esta incidencia debe corregirse a nivel de runtime/método antes de confiar fases largas al orquestador desde CLI con timeout externo.

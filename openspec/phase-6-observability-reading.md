# Phase 6 — observability and reading

## Scope
Definir dashboard, healthcheck, memory, vault y fichas/perfiles de Mugiwara como superficies de lectura del MVP.

## Decisions
- Se adopta arquitectura resource-first para las superficies de lectura.
- `dashboard` y `mugiwara.card` solo agregan resúmenes ya saneados.
- Todas las superficies de esta fase son estrictamente read-only.
- `skills` sigue siendo la única superficie editable del MVP.
- El backend sanea y allowlistea antes de exponer cualquier payload.
- Se fijan rutas prioritarias y modelos de lectura estables antes de implementar producto.

## Definition of done
- rutas y prioridades de lectura documentadas
- separación explícita entre lectura y escritura
- estados visibles y modelos de lectura definidos
- checklist de verify cerrable para fase documental
- closeout en `.engram/` con evidencia del método y riesgos

## Verify expected
- coherencia con la política deny-by-default de backend
- ausencia de nuevas escrituras fuera de `skills`
- saneamiento explícito de payloads observables
- consistencia entre dashboard, recursos propietarios y contratos compartidos

## Método observado en esta fase
- La continuación se lanzó con `--session` y `--agent sdd-orchestrator-zoro`.
- La sesión raíz permaneció en `sdd-orchestrator-zoro` de forma observable.
- Se observaron cierres reales de `sdd-explore-zoro`, `sdd-propose-zoro`, `sdd-spec-zoro` y `sdd-design-zoro`.
- `sdd-tasks-zoro` fue lanzado pero no dejó cierre observable dentro de la ventana disponible.
- El cierre documental se materializó inline usando los artefactos ya persistidos en Engram, siguiendo la política de rescate acordada.

## Judgment-day trigger
Aplicar `judgment-day` cuando estas superficies pasen a implementación efectiva y exista riesgo de fuga de información del host, confusión entre lectura/escritura o bypass de saneamiento/allowlists.

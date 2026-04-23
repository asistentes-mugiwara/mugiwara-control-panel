# Phase 3 — verify checklist

## Checklist funcional
- [ ] El shell frontend del MVP está descrito
- [ ] La navegación principal está fijada
- [ ] Los módulos frontend se alinean con los módulos de producto
- [ ] Solo `skills` conserva edición prevista en MVP

## Checklist de estados
- [ ] Existen estados `loading`, `ready`, `empty`, `error`
- [ ] Se documenta `stale` para módulos operativos
- [ ] Se distingue ausencia de datos de fallo de fuente

## Checklist de arquitectura
- [ ] La separación `app` / `modules` / `shared` está clara
- [ ] El cliente no asume seguridad del host
- [ ] El frontend depende de contratos backend explícitos

## Incidencia de método observada
- Durante el arranque de la fase 3 apareció contaminación de shell por backticks y rutas incrustadas en el prompt (`command not found`, `Is a directory`) antes de que OpenCode procesara el contenido.
- Se definió la solución canónica: invocar prompts complejos mediante fichero temporal + `$(cat fichero)` o, preferentemente, sesión TUI/continuación explícita.
- La fase 3 se cerró inline para no bloquear el progreso documental mientras se estabiliza el método de ejecución SDD desde Hermes.

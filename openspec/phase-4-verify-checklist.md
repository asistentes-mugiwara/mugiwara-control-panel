# Phase 4 — verify checklist

## Checklist funcional
- [ ] `packages/contracts` queda definido como capa compartida
- [ ] Los recursos del MVP tienen shape base documentado
- [ ] Estados compartidos documentados
- [ ] Errores compartidos documentados
- [ ] Versionado de contratos documentado

## Checklist de arquitectura
- [ ] No se introduce lógica de negocio en contratos
- [ ] Backend y frontend pueden consumir el shape sin parsers frágiles
- [ ] La capa de contratos no contradice la frontera deny-by-default

## Checklist de método/Engram
- [ ] La fase deja trazabilidad suficiente para auditoría posterior
- [ ] Se revisa si OpenCode/SDD guardó prompts u observaciones útiles en Engram
- [ ] Si una subfase no cerró correctamente, la incidencia queda documentada

## Observación sobre runtime SDD
- En la fase 4, `sdd-init-zoro` con `gpt-5.4` sí arrancó y avanzó sin el `server_error` previo observado con `gpt-5.3-codex`.
- Aun así, el flujo completo del orquestador no dejó artefactos finales en el repo dentro del timeout externo desde Hermes.
- Esto sugiere mejora parcial del modelo de init, pero no cierre completo del método SDD desde CLI.

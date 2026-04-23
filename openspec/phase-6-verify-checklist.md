# Verify checklist — phase 6 observability and reading

## Comprobaciones mínimas
- [ ] Dashboard, healthcheck, memory, vault y mugiwaras quedan definidos como superficies read-only.
- [ ] `skills` sigue siendo la única escritura permitida del MVP.
- [ ] Las rutas prioritarias quedan fijadas y estables para navegación de agentes.
- [ ] `dashboard` y tarjetas de Mugiwara solo agregan resúmenes saneados.
- [ ] No se exponen logs crudos, secretos, paths del host ni dumps arbitrarios.
- [ ] El backend conserva saneamiento deny-by-default y allowlists explícitas.
- [ ] Estados visibles y modelos de lectura quedan definidos de forma consistente.

## Verify de método SDD observado
- [ ] Confirmar que la sesión raíz continuada permaneció en `sdd-orchestrator-zoro`.
- [ ] Confirmar cierre observable de `sdd-explore-zoro`, `sdd-propose-zoro`, `sdd-spec-zoro` y `sdd-design-zoro`.
- [ ] Documentar si `sdd-tasks-zoro` no cerró en ventana razonable.
- [ ] No afirmar `verify` ni `archive` sin evidencia observable.
- [ ] No afirmar persistencia útil por todos los subagentes en Engram más allá de lo realmente observado.

## Criterio de cierre
La fase puede cerrarse documentalmente si deja definidos recursos, rutas, estados y saneamiento, y además documenta con honestidad el estado real del flujo SDD observado.

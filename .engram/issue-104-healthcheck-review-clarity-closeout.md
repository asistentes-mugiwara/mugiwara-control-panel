# Issue #104 — Healthcheck review clarity closeout

## Qué cambia
- Healthcheck separa contrato y UI entre estado actual, causa actual y bitácora histórica.
- El backend añade `summary_bar.current_cause`, derivado solo de registros vivos, y `events[].kind = historical`.
- `/healthcheck` muestra `En revisión por <fuente>` cuando hay degradación actual y reetiqueta la bitácora como histórica.

## Decisiones
- `En revisión` sigue representando `warn`, no se cambia la lógica operativa de Project health ni de fuentes.
- La causa actual se calcula en backend para evitar que eventos históricos contaminen visual o semánticamente el diagnóstico.
- Los eventos históricos permanecen visibles, pero con copy secundario y etiquetas `Incidencia histórica` / `Evento histórico`.

## No cambia
- No se añaden fuentes nuevas.
- No se ejecutan comandos host nuevos desde backend.
- No se exponen logs crudos, stdout/stderr, paths internos, manifests, tokens, prompts ni secrets.

## Verify previsto
- Backend Healthcheck tests.
- `verify:healthcheck-source-policy`.
- `verify:healthcheck-review-clarity`.
- Typecheck/build web, visual baseline, `git diff --check` y smoke `/healthcheck`.

## Review
Usopp debe revisar claridad visual/copy; Chopper debe revisar contrato/saneado/no-leakage. Franky no es obligatorio salvo que los reviewers detecten impacto operativo, porque no se tocan producers/timers/runtime.

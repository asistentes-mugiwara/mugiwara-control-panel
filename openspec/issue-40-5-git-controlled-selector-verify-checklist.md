# Issue #40.5 — Planning verify checklist

## Repo/context
- [x] Repo inspeccionado desde `/srv/crew-core/projects/mugiwara-control-panel`.
- [x] `main` estaba limpio y alineado con `origin/main` antes de crear rama de planificación.
- [x] Issue #40 sigue abierta.
- [x] PR #92 / 40.4 está mergeada en `main`.
- [x] OpenSpec 40 inicial y 40.4 revisados.
- [x] Código actual de `/git` revisado.

## Decisión de división
- [x] 40.5 se decide como microfase única de frontend server-only.
- [x] No se planifican endpoints backend nuevos.
- [x] No se planifica paginación/navegación de historial amplia.
- [x] La implementación se divide solo en pasos internos: contrato server-side, UI de enlaces, guardrail/smokes/canon.

## Seguridad/alcance
- [x] Query params solo permitidos si validan contra repos/commits ya devueltos por backend.
- [x] Sin paths cliente.
- [x] Sin refs/rangos/revspecs.
- [x] Sin acciones Git.
- [x] Sin working-tree diff.
- [x] Sin líneas de diff en HTML/DOM.
- [x] Sin inputs libres, forms o client-side Git fetch.

## Verify planificado
- [x] `verify:git-server-only` sigue siendo gate obligatorio.
- [x] Typecheck/build/visual baseline incluidos.
- [x] Smokes HTML/DOM para query params válidos e inválidos incluidos.
- [x] Review Usopp + Chopper prevista.

## Verify ejecutado en planificación
- [x] `git diff --check`
- [ ] commit semántico con trailers
- [ ] push de rama de planificación

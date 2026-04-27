# Issue #40 planning closeout — Git control page

## Resultado
Se dejó diseñada la fase inicial para #40 como planificación SDD inline/manual tras timeout de OpenCode en `sdd-init`. No se implementó código runtime.

## Artefactos
- `openspec/issue-40-git-control-page-plan.md`
- `openspec/issue-40-planning-verify-checklist.md`
- `.engram/issue-40-planning-closeout.md`

## Decisión de corte
No implementar #40 como una única feature. La frontera Git mezcla filesystem local, historial, diffs, posibles secretos, estado de working tree, backend API y UI visible. El corte seguro recomendado es:
1. 40.1 backend registry + repo/status foundation, sin diffs.
2. 40.2 backend commits + branches read model, sin diffs.
3. 40.3 commit detail + safe diff con truncado/redacción/omisión.
4. 40.4 frontend `/git` server-only/read-only.
5. 40.5 working tree read-only, probablemente primero summary-only por riesgo de secretos no commiteados.
6. 40.6 closeout/canon.

## Decisiones técnicas
- El cliente debe enviar solo `repo_id`, nunca paths.
- La registry de repos debe ser backend-owned y explícita.
- No debe haber discovery arbitrario de filesystem en request.
- El MVP es read-only estricto: sin checkout/reset/commit/push/pull/fetch/stash/merge/rebase.
- Los diffs se tratan como superficie sensible aunque sean commits históricos; política deny-by-default por path, contenido, tamaño y binarios.
- Ahead/behind solo debe usar refs locales; cualquier operación de red pertenece a productor/operación separada revisada, no al endpoint.
- Frontend `/git` debe seguir patrón server-only con `MUGIWARA_CONTROL_PANEL_API_URL`, página dinámica, fallback saneado y sin `NEXT_PUBLIC_*`.

## Verify de fase
Ejecutado al cierre:
- `git diff --check` — pasa.
- `git status --short --branch` — rama `zoro/issue-40-git-control-page-planning` con solo artefactos de planificación nuevos.

No se ejecutan typecheck/build/tests porque esta fase solo añade documentación de planificación. Si eso cambia antes de commit, actualizar este closeout y la checklist.

## Review esperado
- Planning docs-only: Zoro puede cerrar sin review externa si no hay runtime/security efectivo.
- Primera implementación 40.1: Franky + Chopper.
- UI 40.4: Usopp + Chopper.

## Continuidad
Siguiente paso recomendado: abrir 40.1 backend-only con TDD rojo primero para registry allowlisteada + endpoints `GET /api/v1/git/repos` y `GET /api/v1/git/repos/{repo_id}/status`, añadiendo `verify:git-control-backend-policy` desde el primer PR.

# Issue #40.4 — Frontend `/git` server-only/read-only

## Objetivo
Implementar la ruta `/git` (`Repos Git`) tras el merge de PR #91, consumiendo solo endpoints backend ya cerrados: repos, commits, branches, commit detail y commit diff.

## Alcance implementado
- Navegación principal con `Repos Git`.
- Página server-side dinámica (`export const dynamic = 'force-dynamic'`).
- Adapter `server-only` con `MUGIWARA_CONTROL_PANEL_API_URL`, endpoints fijos y `cache: 'no-store'`.
- Selección inicial backend-owned: primer `repo_id` devuelto por `/repos` y primer SHA devuelto por `/commits`; la UI no introduce paths, refs, rangos ni revspecs.
- Fallback local saneado para API no configurada, inválida o no disponible.
- Cards/listas responsive y panel de diff con redacción/truncado/omisión visible.
- Guardrail `npm run verify:git-server-only`.

## Restricciones preservadas
- Cliente solo usa `repo_id`/SHA backend-owned.
- Sin paths cliente, discovery arbitrario, refs, rangos ni revspecs.
- Sin operaciones mutables: checkout/reset/commit/push/pull/fetch/stash/merge/rebase.
- Sin working-tree diff en 40.4.
- Sin texto libre de commits.
- Sin backend URL, rutas host, detalles internos de ejecución y errores crudos ni errores crudos en UI/fallback.
- UI explicita `Repos Git`, `Solo lectura` y `Diff redactado/truncado/omitido`.

## Verify esperado
```bash
npm run verify:git-server-only
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
npm run verify:visual-baseline
git diff --check
# smoke HTML/DOM anti-leakage con API válida e inválida
```

## Review
Usopp + Chopper: Usopp por UI/UX/responsive/copy; Chopper por server-only/no-leakage/frontera Git. Franky no aplica salvo que se añada polling, cache, productores o runtime operativo.

Nota 40.4: el contenido de líneas del diff se omite en frontend; la UI muestra metadata, contadores y estados de redacción/truncado/omisión para evitar reintroducir canarios o secretos históricos en HTML/DOM. Guardrail: `npm run verify:git-server-only`.

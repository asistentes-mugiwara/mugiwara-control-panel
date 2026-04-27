# Issue #40.4 — Git frontend read-only continuity (`Repos Git`)

## Decisión
La primera UI `/git` es server-only y no interactiva: selecciona el primer repo y commit devueltos por backend para demostrar consumo de repos, commits, branches, commit detail y commit diff sin introducir input cliente nuevo.

## Restricciones vivas
- Solo `repo_id`/SHA backend-owned.
- Sin paths cliente, refs, rangos, revspecs, discovery ni acciones Git.
- Sin working-tree diff en 40.4.
- Sin texto libre de commits.
- Sin backend URL/rutas host/detalles internos de ejecución/stack traces/errores crudos.
- Diff histórico siempre representado como redactado/truncado/omitido cuando aplique.

## Guardrail
`npm run verify:git-server-only` fija adapter `server-only`, env privada, página dinámica, navegación, docs, fallback saneado y ausencia de fugas/acciones prohibidas.

## Verify
Pendiente de ejecución final en rama `zoro/issue-40-4-git-frontend-readonly`: guardrail, typecheck, build, visual baseline, smoke HTML/DOM anti-leakage y `git diff --check`.

Nota 40.4: el contenido de líneas del diff se omite en frontend; la UI muestra metadata, contadores y estados de redacción/truncado/omisión para evitar reintroducir canarios o secretos históricos en HTML/DOM. Guardrail: `npm run verify:git-server-only`.

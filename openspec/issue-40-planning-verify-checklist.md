# Issue #40 planning verify checklist

## Scope
- [x] Issue #40 revisado desde GitHub.
- [x] `main` actualizado con `git pull --ff-only origin main`.
- [x] Rama creada: `zoro/issue-40-git-control-page-planning`.
- [x] Identidad Git local verificada como `zoro`.
- [x] Arquitectura actual revisada: FastAPI routers, módulos backend, frontend navigation/server-only pattern.
- [x] Docs revisadas: `docs/api-modules.md`, `docs/read-models.md`, `docs/runtime-config.md`, `docs/frontend-ui-spec.md`, Project Summary del vault.
- [x] Guardrails existentes revisados en `package.json`.
- [x] OpenCode/SDD intentado; timeout externo en `sdd-init`, planificación recuperada inline/manual.

## Planning quality
- [x] Plan escrito en `openspec/issue-40-git-control-page-plan.md`.
- [x] El plan separa microfases backend, diff seguro, frontend y working tree.
- [x] Cada microfase tiene DoD/verify/reviewers esperados.
- [x] El plan mantiene read-only estricto y deja fuera acciones destructivas Git.
- [x] El plan exige repo IDs allowlisteados y prohíbe paths desde cliente.
- [x] El plan trata diffs como superficie sensible con truncado/redacción/omisión fail-closed.
- [x] El plan propone guardrails nuevos backend/frontend.
- [x] El plan indica docs vivas a actualizar durante implementación.

## Verify ejecutado en esta fase docs/planning
- [x] `git diff --check` — pasa.
- [x] `git status --short --branch` — rama `zoro/issue-40-git-control-page-planning` con solo artefactos de planificación nuevos.

## Verify no ejecutado por no haber cambios de código
- [ ] `npm --prefix apps/web run typecheck` — no requerido en esta fase si no se toca código TS/Next.
- [ ] `npm --prefix apps/web run build` — no requerido en esta fase si no se toca frontend runtime.
- [ ] `PYTHONPATH=. pytest ...` — no requerido en esta fase si no se toca backend runtime.
- [ ] Guardrails específicos Git — todavía no existen; quedan propuestos para 40.1/40.4.

## Review routing preparado
- 40.1/40.2/40.3 backend Git: Franky + Chopper.
- 40.4 frontend `/git`: Usopp + Chopper; Franky solo si hay polling/cache/runtime.
- 40.5 working tree: Franky + Chopper + Usopp si se toca UI.

## Riesgos a arrastrar a implementación
- Diffs históricos o working tree pueden contener secretos aunque el repo sea allowlisteado.
- No ejecutar red ni `fetch` en request para ahead/behind.
- No exponer rutas absolutas, remotes internos, stdout/stderr ni errores crudos.
- Si se usa subprocess Git, debe ser `shell=False`, cwd fijo, timeout, env mínimo y comandos read-only allowlisteados.

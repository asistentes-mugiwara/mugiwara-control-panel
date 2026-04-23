# Verify checklist — phase 7 delivery hardening

## Current worktree evidence
Durante la fase se observó worktree no limpio con cambios tracked en:
- `docs/development.md`
- `scripts/opencode-safe-run.sh`

Regla: el cierre debe integrar o separar estos cambios conscientemente; no pueden quedar como ruido invisible.

## Comprobaciones mínimas
- [ ] `.gitignore` cubre clases de artefactos locales relevantes para repo público.
- [ ] Existe trigger explícito para revisar `.gitignore` cuando aparece tooling/output nuevo.
- [ ] La política de excepciones saneadas queda documentada.
- [ ] La higiene de worktree se trata como gate real de cierre.
- [ ] La trazabilidad exige alinear `README.md`, `AGENTS.md`, `docs/` y `openspec/` cuando cambian reglas.
- [ ] No se modificó código de producto en esta mini-fase.

## Verify de método SDD observado
- [ ] Confirmar permanencia de la sesión raíz en `sdd-orchestrator-zoro`.
- [ ] Confirmar cierres útiles de `explore`, `propose`, `spec`, `design` y `tasks`.
- [ ] Documentar que `apply` no materializó observablemente en la ventana disponible.
- [ ] Documentar la desviación de topic-key entre `roadmap-phase-7-delivery-hardening` y `phase-7-delivery-hardening`.
- [ ] No afirmar `verify` ni `archive` sin evidencia.

## Estado de ejecución en esta fase
- `verify`: no ejecutado como fase SDD observable
- `archive`: no ejecutado como fase SDD observable

## Criterio de cierre
La fase puede cerrarse documentalmente si deja política repo-wide usable, checklist de auditoría, trazabilidad suficiente y honestidad sobre las limitaciones reales del método observado.

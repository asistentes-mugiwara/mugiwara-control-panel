# Issue 121 — planning verify checklist

## Contexto inspeccionado
- [x] Issue #121 leído completo en GitHub.
- [x] Estado Git revisado en `main` antes de crear rama.
- [x] Rama de planificación creada: `zoro/issue-121-vault-redesign-plan`.
- [x] Backend Vault actual inspeccionado: `service.py`, `router.py`, tests.
- [x] Frontend Vault actual inspeccionado: `page.tsx`, `VaultClient.tsx`, `vault-http.ts`.
- [x] Docs relevantes inspeccionadas: `frontend-ui-spec`, `observability-surface`, `backend-boundary`, `runtime-config`.
- [x] Guardrail actual ejecutado: `npm run verify:vault-server-only` falla en main por literal histórico `Estado de API`, incidente registrado en el plan.

## Decisiones de planificación
- [x] Se divide #121 en microfases backend tree, backend document reader, frontend explorer/reader y closeout/canon.
- [x] Chopper queda obligatorio para backend/filesystem y UI no-leakage.
- [x] Usopp queda obligatorio para frontend visible.
- [x] Franky queda condicionado a runtime/deploy/config operativa.
- [x] Escritura de vault, búsqueda full-text, edición y panel derecho quedan fuera de alcance.

## Verify de planificación
- [x] `git diff --check` pasa.
- [x] Roadmap comentado en issue #121: https://github.com/asistentes-mugiwara/mugiwara-control-panel/issues/121#issuecomment-4343455527
- [ ] Plan commiteado y pusheado.
- [ ] Engram actualizado con decisión de microfases.

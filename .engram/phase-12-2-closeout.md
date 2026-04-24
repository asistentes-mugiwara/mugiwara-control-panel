# Phase 12.2 closeout — mugiwaras AGENTS read-only

## Resultado
- `/mugiwaras` pasa a ser el primer vertical read-only no-`skills` respaldado por API.
- Se añade módulo backend `mugiwaras` con catálogo y perfil por slug.
- El catálogo incluye `crew_rules_document`, leído únicamente desde `/srv/crew-core/AGENTS.md` y marcado como canónico/solo lectura.
- La UI de `/mugiwaras` muestra el documento canónico cuando la API está configurada; si no, mantiene fixture saneado sin mostrar contenido AGENTS.

## Decisión técnica
- El requisito de AGENTS.md se implementa en Phase 12.2 porque pertenece a la sección Mugiwara y aprovecha la nueva frontera backend read-only.
- No se crea endpoint genérico de documentos ni navegación filesystem.
- No se lista `/home/agentops/.hermes/hermes-agent/AGENTS.md`; además el servicio rechaza fuentes symlink en tests para evitar duplicidad conceptual.

## Verify ejecutado
- RED: `PYTHONPATH=. pytest apps/api/tests/test_mugiwaras_api.py` falló antes de implementación por ausencia del módulo `mugiwaras`.
- GREEN inicial: `PYTHONPATH=. pytest apps/api/tests/test_mugiwaras_api.py` → 3 passed.
- Suite backend actual: `python -m py_compile apps/api/src/modules/mugiwaras/domain.py apps/api/src/modules/mugiwaras/service.py apps/api/src/modules/mugiwaras/router.py apps/api/src/main.py && PYTHONPATH=. pytest apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py` → 10 passed.
- Frontend typecheck: `npm --prefix apps/web run typecheck` → OK.
- Frontend build: `npm --prefix apps/web run build` → OK.
- Diff hygiene: `git diff --check` → OK.
- Smoke API: `/api/v1/mugiwaras` devolvió `mugiwaras.catalog`, 10 items y `crew_rules_document.display_path == /srv/crew-core/AGENTS.md`.
- Smoke web: `/mugiwaras` renderizó `AGENTS.md — reglas operativas Mugiwara`, incluyó `/srv/crew-core/AGENTS.md` y no incluyó `/home/agentops/.hermes/hermes-agent/AGENTS.md`.

## Riesgos abiertos
- La lectura de `/srv/crew-core/AGENTS.md` es una lectura fija allowlisted; futuras lecturas de documentos no deben reutilizar este patrón como filesystem browser.
- La página queda dinámica para poder leer API en runtime cuando `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` está configurada.

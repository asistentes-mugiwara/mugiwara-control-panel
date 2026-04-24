# Phase 12.1 closeout — read-only contracts foundation

## Resultado
- Se añadieron contratos TypeScript compartidos para las superficies read-only de Phase 12: `dashboard/system`, `mugiwaras`, `memory`, `vault` y `healthcheck`.
- Se expuso `RESOURCE_STATUSES` en `packages/contracts/src/resource.ts` y se deriva `ResourceStatus` de esa constante.
- Se endureció `apps/api/src/shared/contracts.py::resource_response` para rechazar statuses no permitidos.
- Se añadieron tests backend mínimos para el contrato de envelope/status.

## Decisión técnica
- Phase 12.1 queda estrictamente como foundation de contratos: no endpoints, no adapters reales, no lecturas de vault/memoria/host.
- La validación de status se sitúa en el helper compartido backend para fallar temprano si un módulo futuro emite un envelope inválido.
- Los contratos TypeScript mantienen snake_case para alinearse con el payload API/backend existente.

## Verify ejecutado
- RED: `PYTHONPATH=. pytest apps/api/tests/test_shared_contracts.py` falló antes de implementación por ausencia de `ALLOWED_RESOURCE_STATUSES`.
- GREEN parcial: `PYTHONPATH=. pytest apps/api/tests/test_shared_contracts.py` pasó tras implementación.
- Suite backend completa: `python -m py_compile apps/api/src/shared/contracts.py apps/api/tests/test_shared_contracts.py && PYTHONPATH=. pytest apps/api/tests` → 7 passed.
- TypeScript contracts direct compile: `npx --prefix apps/web tsc --noEmit --strict --moduleResolution bundler --module esnext --target es2017 packages/contracts/src/resource.ts packages/contracts/src/read-models.ts` → OK.
- Frontend typecheck: `npm --prefix apps/web run typecheck` → OK.
- Frontend build: `npm --prefix apps/web run build` → OK.
- Diff hygiene: `git diff --check` → OK.

## Riesgos abiertos
- Los contratos aún no están consumidos por endpoints no-`skills`; 12.2 debe elegir un primer vertical real sin ampliar superficie de escritura.
- `ResourceStatus` backend sigue siendo un set manual paralelo al TypeScript; mantenerlos sincronizados si se añaden estados.

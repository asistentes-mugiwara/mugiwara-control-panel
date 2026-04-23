# Phase 9.1 closeout — skills backend allowlist + audit

## Resultado
- Se implementó el primer vertical real de backend para `skills` en `apps/api`.
- El módulo expone catálogo, detalle, preview de diff, update auditado y lectura de auditoría reciente.
- La resolución queda gobernada por `skill_id`, no por paths libres del cliente.
- `packages/contracts` deja de estar vacío y ahora contiene el envelope base y el contrato compartido de `skills`.

## Verify ejecutado
- `python -m pytest apps/api/tests -q` ✅
- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅
- `git diff --check` ✅

## Método / runtime
- La fase se implementó inline en Hermes por tratarse del primer vertical backend real pero aún acotado.
- Se mantuvo deny-by-default, allowlist explícita, control de fingerprint y auditoría mínima persistida.

## Riesgos abiertos
- La allowlist sigue codificada en backend y todavía no tiene gestión dinámica.
- La auditoría persiste en JSONL de runtime local; más adelante puede migrarse a datastore dedicado.
- El frontend aún no consume estos endpoints reales.

## Siguiente paso recomendado
- conectar el frontend `skills` a este backend real usando los contratos nuevos y decidir si hace falta preview de diff en UI antes de habilitar edición visible.

# Issue #36.1 — Backend system metrics verify checklist

## Preflight
- [x] `git status --short --branch` en repo.
- [x] `git fetch origin --prune`.
- [x] `git switch main`.
- [x] `git pull --ff-only origin main`.
- [x] `gh issue view 36` confirma #36 abierto.
- [x] `gh pr list --state open` confirma sin PRs abiertas.
- [x] `gh issue list --state open` confirma solo #36 y #40.
- [x] Identidad Git local configurada como Zoro.
- [x] Rama creada: `zoro/issue-36-1-system-metrics-backend`.

## Contexto
- [x] Engram: observación `Issue 36 header metrics planning strategy` consultada.
- [x] Plan 36.0 leído: `openspec/issue-36-header-system-metrics-plan.md`.
- [x] Patrones backend revisados: `usage`, `healthcheck`, `main.py`, `shared.contracts` y tests existentes.
- [x] Docs vivas revisadas: `docs/api-modules.md`, `docs/read-models.md`, `docs/security-perimeter.md`.

## TDD
- [x] Test rojo escrito antes de implementación: `apps/api/tests/test_system_metrics_api.py`.
  - Resultado inicial: falla con `ModuleNotFoundError: No module named 'apps.api.src.modules.system'`.
- [x] Implementación mínima hasta verde:
  - `apps/api/src/modules/system/service.py`.
  - `apps/api/src/modules/system/router.py`.
  - `apps/api/src/modules/system/__init__.py`.
  - `apps/api/src/modules/system/AGENTS.md`.
  - Registro en `apps/api/src/main.py`.
- [x] Tests verdes: `PYTHONPATH=. pytest apps/api/tests/test_system_metrics_api.py -q`.

## Contrato
- [x] Endpoint fijo `GET /api/v1/system/metrics`.
- [x] Resource envelope `resource='system.metrics'`.
- [x] Meta `read_only`, `sanitized`, `source='os-allowlisted-system-metrics'`.
- [x] Disk target público saneado `fastapi-visible-root-filesystem`, sin path crudo.
- [x] RAM: `MemTotal - MemAvailable`.
- [x] Disco: target backend-owned `/` vía `shutil.disk_usage('/')`.
- [x] Uptime: parseo estrecho de `/proc/uptime` a días/horas/minutos.
- [x] Degradación por familia a `source_state='unknown'` y valores `null`.
- [x] Sin input cliente para seleccionar fuentes.
- [x] Sin raw errors/paths/logs/stdout/stderr/host internals en respuesta.

## Guardrails/docs
- [x] Guardrail creado: `scripts/check-system-metrics-backend-policy.mjs`.
- [x] Script npm añadido: `verify:system-metrics-backend-policy`.
- [x] Contratos TypeScript actualizados en `packages/contracts/src/read-models.ts`.
- [x] Docs actualizadas:
  - `docs/api-modules.md`.
  - `docs/read-models.md`.
  - `docs/security-perimeter.md`.
- [x] OpenSpec 36.1 creado.
- [x] Closeout `.engram` creado.

## Verify final
- [x] `python3 -m py_compile apps/api/src/modules/system/*.py apps/api/tests/test_system_metrics_api.py`.
- [x] `PYTHONPATH=. pytest apps/api/tests/test_system_metrics_api.py -q`.
  - Resultado: 3 passed.
- [x] `PYTHONPATH=. pytest apps/api/tests/test_perimeter_api.py apps/api/tests/test_healthcheck_dashboard_api.py -q`.
  - Resultado: 50 passed.
- [x] `npm run verify:system-metrics-backend-policy`.
- [x] `npm run verify:perimeter-policy`.
- [x] `npm run verify:healthcheck-source-policy`.
- [x] `npm --prefix apps/web run typecheck`.
- [x] `git diff --check`.
- [x] `git status --short --branch` revisado.

## Review/PR
- [x] Commit con trailers Mugiwara.
  - Commit: `5d31598` (`feat: add system metrics backend read model`).
- [x] Rama pusheada.
- [x] PR abierta.
  - PR: https://github.com/asistentes-mugiwara/mugiwara-control-panel/pull/85.
- [x] Comentario de handoff en PR.
  - Comentario: https://github.com/asistentes-mugiwara/mugiwara-control-panel/pull/85#issuecomment-4327111361.
- [x] Franky invocado y respuesta registrada.
  - Decisión: `approve` por comentario; aprobación formal bloqueada por cuenta compartida/autora.
  - Comentario: https://github.com/asistentes-mugiwara/mugiwara-control-panel/pull/85#issuecomment-4327129685.
  - Follow-ups: en 36.2 definir polling/TTL si se añade refresh; si FastAPI acaba en contenedor, documentar que disco representa la raíz visible por runtime.
- [x] Chopper invocado y respuesta registrada.
  - Decisión: `approve` por comentario; aprobación formal bloqueada por cuenta compartida/autora.
  - Comentario: https://github.com/asistentes-mugiwara/mugiwara-control-panel/pull/85#issuecomment-4327151013.
  - Follow-up: endpoint aceptable solo dentro del perímetro privado; si se expone fuera de LAN/Tailscale/private proxy, requiere auth/sesión/rate-limit.
- [x] No cerrar #36 todavía.
- [x] No tocar #40.

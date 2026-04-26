# Phase 15.8 — Healthcheck real-source block closeout / canon refresh

## Objetivo
Cerrar formalmente el bloque Phase 15 de Healthcheck real-source hasta Phase 15.7b, dejando estado canónico, follow-ups y siguiente orden técnico explícitos sin mezclar nuevas fuentes vivas ni pulido UI.

## Por qué ahora
Phase 15 ya completó el recorrido seguro desde contratos sin live reads hasta adapters/producers revisados para fuentes host-adjacent principales. Tras cerrar los follow-ups #58 y #54, el bloque necesita un cierre canónico antes de abrir nuevas superficies de producto o productores restantes.

## Alcance cerrado por Phase 15
- Foundation de contratos y policy:
  - 15.1 plan de fuentes reales.
  - 15.2a vocabulario/source IDs/check IDs backend-owned.
  - 15.2b registry/normalizer allowlist-only.
  - 15.2c guardrail anti host-console, manifest ownership y freshness thresholds.
- Sanitización previa a adapters vivos:
  - 15.3 prerequisite / #34: labels backend-owned y saneado defensivo de campos textuales permitidos.
- Adapters vivos reader-only:
  - 15.3a `vault-sync` desde manifiesto fijo Franky-owned.
  - 15.3b `backup-health` desde manifiesto fijo Franky-owned y fail-closed.
  - 15.4a `project-health` desde manifiesto fijo Zoro-owned.
  - 15.5a `gateway-status` agregado/per-Mugiwara desde manifiesto fijo Franky-owned.
  - 15.6a `cronjobs` desde manifiesto fijo Franky-owned.
- Producers/runners seguros cerrados:
  - 15.4b + #43: `project-health-status` con timer user-level y hotfix `python3`.
  - 15.5b + 15.7b/#54: `gateway-status` con timer user-level, output fijo instalado, `TimeoutStartSec=30s` y fsync de directorio padre.
  - 15.6b + 15.7a/#58: `cronjobs-status` con timer user-level y límite 1 MiB por registry antes de `json.loads`.

## Decisiones de canon
- Phase 15 se considera cerrado como bloque de **conexión segura de fuentes reales principales**.
- `vault-sync` y `backup-health` quedan con readers vivos y degradación segura, pero sus productores/manifest writers periódicos quedan como follow-ups operativos separados, no blockers del cierre del bloque.
- No se añade UI nueva en esta microfase; el pulido de estados visibles se mantiene en issues #44 y #45.
- No se añaden GitHub issue/PR counts ni last-verify aggregation en este cierre; requieren microfase separada.
- El backend Healthcheck sigue sin shell, Git, Docker, systemd, generic filesystem discovery, logs/stdout/stderr o host internals crudos.

## Follow-ups abiertos tras cierre
1. Productores/manifest writers Franky-owned para `vault-sync-status.json` y `backup-health-status.json`, con permisos restrictivos y schemas mínimos saneados.
2. Issue #44: mejorar priorización visual de Healthcheck y reducir badges duplicados.
3. Issue #45: aclarar fallback/not-configured across API-backed pages.
4. Issues UI/producto no bloqueantes: #46, #47, #48, #51, #40 y #36.

## Fuera de alcance
- Implementar nuevos productores `vault-sync`/`backup-health`.
- Tocar backend, frontend o unidades systemd.
- Cambiar thresholds o semántica del read model.
- Ejecutar smoke visual profundo o baseline nueva; no hay cambio UI.
- Pedir review externa: esta PR es canon/docs-only de bajo riesgo y no toca runtime, seguridad efectiva, dependencias ni UI.

## Verify esperado
```bash
npm run verify:healthcheck-source-policy
npm run verify:project-health-runner
npm run verify:gateway-status-runner
npm run verify:cronjobs-status-runner
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
python -m py_compile apps/api/src/modules/healthcheck/source_adapters.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py
git diff --check
```

## Definition of Done
- OpenSpec de closeout creado.
- Checklists de follow-ups cerrados (#54/#58) actualizadas.
- Docs de policy/API/read-models reflejan Phase 15 cerrada hasta 15.7b.
- `.engram` deja continuidad clara.
- Project Summary del vault queda alineado.
- PR docs-only mergeada a `main` o rama preparada sin drift.

# Phase 18.0 — Healthcheck producers planning closeout

## Resultado
Phase 18.0 planifica y reconcilia el bloque de productores Healthcheck pendientes después del cierre de Phase 17 Usage / #51. No implementa productores vivos ni timers.

## Estado real confirmado
- Repo local inició limpio y alineado con `main...origin/main`.
- GitHub solo mantiene abiertas #40 y #36, explícitamente fuera de este bloque.
- No había PRs abiertas al iniciar la microfase.
- Engram confirma cierre de Phase 17 Usage / #51 por PR #77.
- Project Summary ya marca Phase 18.x como siguiente bloque recomendado.
- Backend Healthcheck ya tiene readers fijos para `vault-sync-status.json` y `backup-health-status.json`.
- Runtime actual contiene manifests de `project-health`, `gateway-status` y `cronjobs-status`; no contiene aún `vault-sync-status` ni `backup-health-status`.

## Decisión de atomización
Mantener Phase 18.x en cinco microfases:
1. 18.1 productor `vault-sync-status`.
2. 18.2 runner/timer `vault-sync-status`.
3. 18.3 productor `backup-health-status`.
4. 18.4 runner/timer `backup-health-status`.
5. 18.5 closeout/canon.

La razón es separar fuente, sensibilidad y automatización persistente. Backup-health es más sensible que vault-sync y no debe compartir PR con él.

## Contratos fijados
- Productores fuera del backend.
- Backend solo consume manifests fijos saneados.
- Manifests mínimos con timestamps ISO UTC y semántica allowlisted.
- Escritura atómica con permisos no públicos.
- Units user-level con ExecStart fijo a script npm, sin output override en unidades instaladas.
- Review Franky + Chopper por cada PR de productor/runner.

## Verify Phase 18.0
Completado antes de PR:
- `npm run verify:healthcheck-source-policy` — passed.
- `git diff --check` — passed.

## Riesgos/followups
- Phase 18.1 debe confirmar fuente operacional segura para vault-sync antes de escribir estado vivo.
- Phase 18.3 debe confirmar fuente operacional segura para backup-health sin serializar rutas, nombres, hashes ni destinos.
- Si la fuente disponible solo ofrece logs/raw outputs, no implementar manifest vivo hasta diseñar saneado específico o pedir decisión operativa.

## Siguiente microfase recomendada
Después de mergear 18.0, empezar por Phase 18.1 productor `vault-sync-status`: menor sensibilidad que backup-health y valida el patrón del bloque antes de tocar backups.

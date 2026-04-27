# Phase 18.0 — Healthcheck producers planning/reconciliation

## Objetivo
Cerrar el contrato técnico del bloque Phase 18.x antes de implementar productores vivos de Healthcheck para `vault-sync-status.json` y `backup-health-status.json`.

Esta microfase es deliberadamente de planificación/reconciliación: no añade productores, runners, timers ni nuevas lecturas host. Su función es fijar fronteras, fuentes, manifests, permisos, ownership, DoD y verify para que las siguientes PRs sean pequeñas, revisables y seguras.

## Contexto reconciliado
- Phase 17 queda cerrada como Usage / GitHub #51 por PR #77; no se reabre salvo bug/regresión clara.
- El plan verbal anterior que asociaba 17.x a productores Healthcheck quedó corregido: los productores pendientes pasan a Phase 18.x.
- Issues abiertas reales en GitHub al iniciar 18.0: #40 Git control page y #36 header metrics. Ambas quedan fuera de Phase 18.
- No hay PR abierta al iniciar 18.0.
- `Project Summary - Mugiwara Control Panel.md` ya marca Phase 18.x como siguiente bloque recomendado.

## Estado real inspeccionado

### Readers/adapters backend existentes
Los adapters ya existen en `apps/api/src/modules/healthcheck/source_adapters.py`:

| Fuente | Adapter | Manifest fijo esperado | Estado seguro si falta |
| --- | --- | --- | --- |
| `vault-sync` | `VaultSyncManifestAdapter` | `/srv/crew-core/runtime/healthcheck/vault-sync-status.json` | `not_configured` |
| `backup-health` | `BackupHealthManifestAdapter` | `/srv/crew-core/runtime/healthcheck/backup-health-status.json` | `not_configured` |
| `project-health` | `ProjectHealthManifestAdapter` | `/srv/crew-core/runtime/healthcheck/project-health-status.json` | ya tiene producer/timer |
| `hermes-gateways` + `gateway.<slug>` | `GatewayStatusManifestAdapter` | `/srv/crew-core/runtime/healthcheck/gateway-status.json` | ya tiene producer/timer |
| `cronjobs` | `CronjobsManifestAdapter` | `/srv/crew-core/runtime/healthcheck/cronjobs-status.json` | ya tiene producer/timer |

El backend Healthcheck debe seguir leyendo únicamente manifests fijos saneados. No debe ejecutar shell/Git/systemd, navegar filesystem, leer logs/stdout/stderr ni convertirse en consola host.

### Runtime actual de manifests
En `/srv/crew-core/runtime/healthcheck/` existen `project-health-status.json`, `gateway-status.json` y `cronjobs-status.json`. No existen aún los manifests vivos de `vault-sync-status.json` ni `backup-health-status.json`; por tanto los readers de esas fuentes deben seguir degradando de forma visible hasta que Phase 18.1/18.3 cierren sus productores.

### Scripts/runners existentes como patrón
Patrones ya cerrados y reutilizables:
- `scripts/write-project-health-status.py` + `mugiwara-project-health-status.timer`: productor repo-local con JSON mínimo, permisos no públicos y script npm fijo.
- `scripts/write-gateway-status.py` + `mugiwara-gateway-status.timer`: productor systemd user-level fuera del backend, output fijo en unidad, `TimeoutStartSec=30s` y fsync del directorio padre.
- `scripts/write-cronjobs-status.py` + `mugiwara-cronjobs-status.timer`: productor fuera del backend desde registries Hermes allowlisted, con límite de tamaño antes de parsear.

## Principios Phase 18.x
1. Productores fuera del backend; backend solo consume manifests fijos saneados.
2. Una fuente por microfase. No mezclar `vault-sync` y `backup-health` en una PR.
3. Separar productor y runner/timer cuando haya automatización persistente.
4. JSON mínimo y estable; no serializar datos que el backend no necesita.
5. Escritura atómica: temp file en el mismo directorio, `fsync`, `os.replace`, `chmod 0640` y fsync del directorio padre.
6. Directorio runtime no público: `0750` salvo decisión operativa distinta de Franky.
7. Units user-level con `ExecStart` fijo a script npm revisado, sin `--output` ni rutas alternativas en la unidad instalada.
8. Review Franky + Chopper obligatoria para cada PR que toque productor, runner, permisos, manifests o frontera host.
9. No mezclar #40, #36 ni mejoras UI de `/usage` dentro de Phase 18.

## Contratos mínimos de manifest

### `vault-sync-status.json`
Owner: Franky. Safe location class: Franky-owned operational source.

Shape mínimo permitido:
```json
{
  "status": "success",
  "result": "success",
  "updated_at": "2026-04-27T07:00:00Z",
  "last_success_at": "2026-04-27T07:00:00Z"
}
```

Campos requeridos para Phase 18.1:
- `status`: enum saneado producido por el writer.
- `result`: duplicado semántico estable para compatibilidad con reader.
- `updated_at`: timestamp ISO UTC del cálculo del manifest.
- `last_success_at`: timestamp ISO UTC del último sync correcto si está disponible de forma segura; si no, debe omitirse o degradar sin inventar éxito.

No serializar:
- branch, remotes, ahead/behind detallado, SHAs, diffs, untracked files, paths del vault, stdout/stderr, logs, errores crudos, comandos, tokens, `.env`, credenciales, targets de sync ni outputs host.

Semántica inicial recomendada:
- `success|ok|pass` solo si la fuente operacional confirma sync correcto de forma explícita.
- `warning|warn|stale|dirty|diverged|ahead|behind` para divergencias o estado no verde sin detalle sensible.
- `failed|fail|error` para fallo explícito.
- Ausencia de fuente verificable debe producir manifest degradado o fallar cerrado; no debe escribir verde por defecto.

### `backup-health-status.json`
Owner: Franky. Safe location class: Franky-owned backup status manifest.

Shape mínimo permitido:
```json
{
  "status": "success",
  "result": "success",
  "updated_at": "2026-04-27T07:00:00Z",
  "last_success_at": "2026-04-27T07:00:00Z",
  "checksum_present": true,
  "retention_count": 4
}
```

Campos requeridos para Phase 18.3:
- `status`: enum saneado producido por el writer.
- `result`: duplicado semántico estable para compatibilidad con reader.
- `updated_at`: timestamp ISO UTC del cálculo del manifest.
- `last_success_at`: timestamp ISO UTC del último backup correcto si está disponible de forma segura.
- `checksum_present`: booleano, no checksum ni hash concreto.
- `retention_count`: entero agregado, no nombres de backups.

No serializar:
- rutas de archivos, nombres de backups, archive paths, included paths, tamaños, hashes/checksums concretos, destinos Drive, IDs, stdout/stderr, logs, raw output, errores crudos, tokens, `.env`, credenciales ni targets externos.

Semántica fail-closed:
- `pass` solo con resultado positivo explícito, `checksum_present is true` y `retention_count >= 4`.
- Cualquier parcialidad, ausencia, enum desconocido, checksum falso/ausente o retención insuficiente degrada a `warn/stale/unknown`; nunca a verde silencioso.

## Microfases Phase 18.x

### Phase 18.1 — Producer `vault-sync-status`
Rama sugerida: `zoro/phase-18-1-vault-sync-status-producer`.

Alcance:
- Crear `scripts/write-vault-sync-status.py`.
- Añadir tests dirigidos del productor.
- Añadir script npm `write:vault-sync-status`.
- Añadir guardrail `verify:vault-sync-status-runner` o equivalente acotado a productor si el runner queda para 18.2.
- Actualizar docs de Healthcheck si cambia el contrato operativo.

Fuera de alcance:
- Unit/timer systemd.
- Backup-health.
- Cambios backend salvo tests/smoke si aparece regresión clara.

DoD:
- Manifiesto real escrito en `/srv/crew-core/runtime/healthcheck/vault-sync-status.json` con shape mínimo y permisos esperados.
- Reader Healthcheck deja de degradar `vault-sync` por ausencia de manifest cuando la fuente real es verificable.
- No hay datos sensibles serializados en manifest ni payload API.

Verify:
- `python3 -m py_compile scripts/write-vault-sync-status.py ...tests...`
- pytest dirigido del productor y smoke Healthcheck contra manifest real.
- `npm run verify:healthcheck-source-policy`.
- `npm run verify:vault-sync-status-runner` si se añade.
- `npm run write:vault-sync-status`.
- validación de shape/permisos del manifest real.
- `git diff --check`.

Review: Franky + Chopper.

### Phase 18.2 — Runner/timer `vault-sync-status`
Rama sugerida: `zoro/phase-18-2-vault-sync-status-runner`.

Alcance:
- Añadir `ops/systemd/user/mugiwara-vault-sync-status.service`.
- Añadir `ops/systemd/user/mugiwara-vault-sync-status.timer`.
- Añadir `scripts/install-vault-sync-status-user-timer.sh`.
- Endurecer guardrail runner.

Decisión inicial:
- Timer recomendado: 15–30 min; thresholds existentes: warn 90 min / fail 360 min.
- Unit llama `npm run write:vault-sync-status` desde repo root, sin `--output` ni overrides.
- Usar `TimeoutStartSec=30s`, `NoNewPrivileges=yes`, `PrivateTmp=yes`, `ProtectSystem=full`, `ProtectHome=read-only` si no rompe la fuente operacional.

DoD:
- Timer instalado/activo en systemd user y manifiesto refrescado por servicio.
- La unidad no permite salida alternativa ni comandos arbitrarios.

Verify:
- `systemd-analyze --user verify ...service ...timer`.
- ejecutar installer.
- `systemctl --user start mugiwara-vault-sync-status.service`.
- `systemctl --user is-active mugiwara-vault-sync-status.timer`.
- validar shape/permisos/frescura del manifest real.
- smoke API Healthcheck.
- guardrail runner.
- `git diff --check`.

Review: Franky + Chopper.

### Phase 18.3 — Producer `backup-health-status`
Rama sugerida: `zoro/phase-18-3-backup-health-status-producer`.

Alcance:
- Crear `scripts/write-backup-health-status.py`.
- Añadir tests dirigidos del productor.
- Añadir script npm `write:backup-health-status`.
- Añadir guardrail `verify:backup-health-status-runner` o equivalente acotado a productor si runner queda para 18.4.
- Actualizar docs si cambia el contrato.

Fuera de alcance:
- Unit/timer systemd.
- Ejecución de backups reales desde el runner. El producer observa/sintetiza estado seguro; no dispara backups salvo decisión explícita posterior.
- Exponer nombres/rutas/hashes/destinos.

DoD:
- Manifiesto real escrito con shape mínimo, permisos esperados y semántica fail-closed.
- Reader Healthcheck representa backup con estado derivado del manifest sin leakage.

Verify:
- py_compile + pytest dirigido.
- `npm run verify:healthcheck-source-policy`.
- guardrail del producer/runner.
- `npm run write:backup-health-status`.
- validación shape/permisos del manifest real.
- smoke API Healthcheck.
- `git diff --check`.

Review: Franky + Chopper.

### Phase 18.4 — Runner/timer `backup-health-status`
Rama sugerida: `zoro/phase-18-4-backup-health-status-runner`.

Alcance:
- Añadir service/timer user-level e installer.
- Automatizar refresco periódico del manifest backup sin ejecutar backups.

Decisión inicial:
- Timer recomendado: 6–12h o hook post-backup si Franky valida mejor integración operacional.
- Thresholds existentes: warn 1800 min / fail 4320 min.
- Unit llama `npm run write:backup-health-status`, sin `--output` ni overrides.

DoD:
- Timer instalado/activo o decisión explícita documentada si se elige hook post-backup en vez de timer.
- Manifest backup fresco tras ejecución del servicio.

Verify:
- `systemd-analyze --user verify`.
- installer + `systemctl --user start`.
- `systemctl --user is-active ...timer` si aplica.
- validación manifest real.
- smoke API Healthcheck.
- guardrail runner.
- `git diff --check`.

Review: Franky + Chopper.

### Phase 18.5 — Closeout/canon Healthcheck producers
Rama sugerida: `zoro/phase-18-5-healthcheck-producers-closeout`.

Alcance:
- Actualizar `docs/healthcheck-source-policy.md`, `docs/api-modules.md`, `docs/read-models.md`, OpenSpec y `.engram/` con estado final.
- Actualizar Project Summary del vault.
- Guardar observación Engram.
- Confirmar que `vault-sync` y `backup-health` ya no aparecen `not_configured` por ausencia de manifest si los runners están activos.

DoD:
- Bloque Phase 18.x cerrado y canon alineado.
- Riesgos residuales/followups documentados como issues o notas de closeout.

Verify:
- guardrails Healthcheck relevantes.
- smoke API Healthcheck.
- `git diff --check`.

Review:
- Si solo docs/canon y sin runtime efectivo, Zoro puede proponer excepción; si incluye smoke/decisiones operativas, Franky + Chopper.

## Riesgos y decisiones pendientes
- Fuente operacional exacta de `vault-sync-status`: Phase 18.1 debe confirmar si se consume salida/status de `vault-sync.sh`, un marcador post-sync existente o un estado ya producido por Franky. Si esa frontera no está clara, no escribir productor vivo todavía.
- Fuente operacional exacta de `backup-health-status`: Phase 18.3 debe confirmar cómo detectar último backup correcto, checksum presente y retención sin enumerar rutas/nombres/hashes sensibles.
- Ownership runtime: owner lógico Franky; implementación en repo bajo custodia Zoro. La PR debe dejar claro qué parte es producer versionado y qué parte es operación host.
- Permisos: default 0750/0640; cualquier desviación debe estar motivada por systemd user/lectura backend y revisada por Franky + Chopper.
- Los runners deben refrescar estado, no ejecutar acciones administrativas amplias.
- Si para vault-sync o backup-health la única fuente disponible incluye logs/raw outputs, Phase 18.1/18.3 debe introducir un paso de saneado previo o pedir decisión operativa antes de escribir manifest vivo.

## Verify de Phase 18.0
- Repo inspeccionado en `main...origin/main` limpio antes de abrir rama.
- GitHub inspeccionado: issues abiertas #40 y #36; PRs abiertas: ninguna.
- Project Summary leído y alineado con Phase 18.x como siguiente bloque.
- Engram leído: observación `Closed Phase 17 Usage #51` confirma cierre de #51 y paso a Phase 18.x.
- Readers/adapters Healthcheck, scripts existentes y unidades systemd revisados.
- `git diff --check` debe pasar antes de abrir PR.

## Política de cierre
Phase 18.0 se considera cerrada solo tras PR revisada por Franky + Chopper o tras bloqueo explícito documentado. Las siguientes microfases no deben empezar hasta que Pablo reciba feedback de cierre/recomendación.

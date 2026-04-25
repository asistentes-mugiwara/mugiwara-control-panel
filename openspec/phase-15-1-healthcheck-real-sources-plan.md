# Phase 15.1 — Healthcheck real sources plan

## Objective
Plan the next Healthcheck block so the control panel can show real operational health for:

- Vault sync health and last sync.
- Project health.
- Backup health and last backup.
- Hermes gateway global health.
- Gateway health per Mugiwara.
- Active cronjobs health.

This phase is planning only. It converts Pablo's requested operational surfaces into a safe, incremental implementation plan under the Phase 13 private perimeter and the Phase 14.1 timestamp/severity hardening foundation.

## Why now
Phase 14.1 closed issue #16 as the foundation for Healthcheck/Dashboard hardening: timestamps are parsed explicitly and Dashboard honors deterministic `critical` severity. The next risk is not aggregation logic, but source boundary design. These sources touch host/runtime state, backups, Git, gateways and cronjobs, so they must be planned before implementation.

## Current repo state used for planning
- Project repo `main` is aligned with `origin/main` and has no open GitHub issues or PRs at planning time.
- `docs/api-modules.md` already lists Healthcheck as the module for cronjobs, backups, gateways and safe operational checks.
- `docs/observability-surface.md` requires Healthcheck to expose state/freshness/warning/source labels without raw process output, systemd unit content, host metadata or command output.
- `docs/read-models.md` already defines `healthcheck.workspace` and `healthcheck.summary[]` as read-only sanitized read models.
- `scripts/vault-sync.sh` exists and produces safe high-level success/error messages, but does not currently persist a structured status manifest.
- `scripts/system-backup.sh` exists and creates local backup archives + `.sha256` files under `/srv/crew-core/backups` with retention count 4.
- User-level systemd currently exposes Hermes gateway services per Mugiwara as `hermes-gateway-<slug>.service`; this is a real source but must be queried through an allowlisted adapter and summarized only.
- Hermes cronjobs are not visible from Zoro's profile via `cronjob list` at planning time, so active cronjob health needs an explicit source contract rather than assuming profile-local state.

## Principles
1. **Explicit source adapters only.** No generic host console, no arbitrary command executor, no user-provided path/URL/method.
2. **Backend owns sanitization.** Raw outputs stay inside source adapters and are converted to typed summaries before serialization.
3. **Stable read model first.** Extend Healthcheck contracts before connecting multiple sources.
4. **One source family per implementation microphase.** Avoid mixing vault sync, backups, gateways and cronjobs in one large PR.
5. **Private perimeter only.** This does not add public internet support, auth/session/rate-limit or write controls.
6. **No raw logs.** Do not expose stdout/stderr, systemd journal lines, backup file paths, command lines, environment values or internal IDs.
7. **Agent-readable.** Every check must include `status`, `severity`, `freshness`, `warning_text`, `source_label` and a stable `check_id`.

## Proposed health source families

### 1. Vault sync health
Purpose:
- Show whether the vault Git repo is aligned with `origin/main`.
- Show last successful sync timestamp when safely knowable.
- Show stale/degraded if local changes, divergence or sync status cannot be determined.

Safe output examples:
- `label`: `Vault sync`
- `status`: `pass | warn | stale | fail`
- `severity`: `low | medium | high | critical`
- `freshness.updated_at`: ISO timestamp of latest safe sync signal.
- `warning_text`: short sanitized text such as `Vault pendiente de sincronización.`
- `source_label`: `Vault Git safe summary`

Implementation note:
- Prefer a structured status manifest produced by `vault-sync.sh` or a wrapper owned by Franky, for example a small JSON/status file with timestamp/result/branch/ahead/behind counts.
- If querying Git directly from backend, only via a fixed allowlisted repo path and fixed operations; never expose raw Git output.

### 2. Project health
Purpose:
- Show the health of official software projects, starting with `mugiwara-control-panel`.
- Summarize local Git cleanliness, remote alignment, open issues/PR count if safely queryable, and last project verify signal if available.

Safe output examples:
- `label`: `Project health`
- `source_label`: `Project GitHub safe summary`
- `warning_text`: `Proyecto con PRs abiertas.` / `Proyecto alineado con origin.`

Implementation note:
- Start with this project only; expand to multiple projects later via allowlisted project registry.
- Do not expose branch names beyond expected public-safe branches unless needed; no file paths or diff contents.
- GitHub issue/PR counts can be sourced via a safe script/cache instead of runtime API calls from request path.

### 3. Backup health
Purpose:
- Show last local backup timestamp and checksum presence.
- Show retention state against the expected 4 local copies.
- Future separate source can cover Drive/private remote backup status if a safe manifest exists.

Safe output examples:
- `label`: `Backups`
- `freshness.updated_at`: timestamp inferred from latest archive/checksum pair.
- `warning_text`: `Último backup reciente y checksum presente.` / `Backup local stale.`
- `source_label`: `Backup manifest safe summary`

Implementation note:
- Prefer reading a safe manifest generated by `system-backup.sh`; current archive filenames and checksum files are enough for a first local-only adapter but the API must not return archive paths, file sizes if considered sensitive, included paths, or backup manifest internals.
- Drive backup health should remain a later subphase unless a sanitized Drive upload manifest already exists.

### 4. Hermes gateway global health
Purpose:
- Show whether the gateway layer is broadly available.
- Aggregate per-Mugiwara gateway health into a single global signal.

Safe output examples:
- `label`: `Hermes gateways`
- `status`: `pass` if all required gateways are active, `warn` if optional gateway missing, `fail` if core gateway missing.
- `source_label`: `Systemd user safe summary`

Implementation note:
- Query only allowlisted user services matching known Mugiwara slugs.
- Do not expose command lines, unit file content, journal output, PIDs, runtime paths or restart logs.

### 5. Gateway health per Mugiwara
Purpose:
- Show one card/signal per Mugiwara gateway.
- Required slugs: `luffy`, `zoro`, `franky`, `nami`, `robin`, `usopp`, `chopper`, `brook`, `jinbe`, `sanji`.

Safe output examples:
- `check_id`: `gateway.luffy`
- `label`: `Gateway Luffy`
- `status`: `pass | warn | fail | stale`
- `warning_text`: `Gateway activo.` / `Gateway no activo.`

Implementation note:
- Keep slug allowlist in code/config, not client input.
- Consider Chopper/Franky review mandatory because this touches systemd/runtime state.

### 6. Active cronjobs health
Purpose:
- Show whether expected active cronjobs exist and have recent successful runs.
- Distinguish system cron, Hermes cronjobs and profile-owned scheduled tasks.

Safe output examples:
- `label`: `Cronjobs activos`
- `status`: `pass | warn | stale | fail`
- `warning_text`: `Sin cronjobs activos conocidos.` / `Job crítico stale.`

Implementation note:
- Zoro's profile currently has no jobs via `cronjob list`; do not infer global active jobs from that.
- Define a sanitized cron registry or status manifest first. The manifest should include only job name, owner profile, expected cadence, last_run_at, last_status and criticality. No prompt bodies, commands, targets, chat IDs, logs or stdout/stderr.
- Franky should own/validate the operational source for cron state.

## Proposed implementation microphases

### Phase 15.2 — Health source contracts and registry
Scope:
- Extend backend Healthcheck domain with a `HealthSourceRecord`/source adapter contract if needed.
- Add source family IDs and stable check IDs.
- Add tests for source normalization, status/severity allowlists and no sensitive fields.
- Update read-model docs.

DoD:
- No live host reads yet.
- Existing Healthcheck output remains compatible.
- Tests prove unknown fields are not serialized and invalid source values degrade safely.

Verify:
```bash
python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
npm run verify:health-dashboard-server-only
npm run verify:perimeter-policy
git diff --check
```

Review:
- Chopper + Franky.

### Phase 15.3 — Vault sync + local backup safe adapters
Scope:
- Add fixed allowlisted adapters for vault sync summary and local backup summary.
- Prefer structured manifests; if absent, read only fixed allowlisted paths with strictly bounded metadata.
- Show last sync and last backup in Healthcheck.

DoD:
- No raw paths, archive names, command output, included backup paths or Git output exposed.
- Stale/missing states are visible.
- Tests cover recent, stale, missing checksum, divergent/unknown sync states.

Verify:
```bash
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
PYTHONPATH=. python -m pytest apps/api/tests -q
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
npm run verify:health-dashboard-server-only
npm run verify:perimeter-policy
git diff --check
```

Review:
- Chopper + Franky.

### Phase 15.4 — Project health safe adapter
Scope:
- Add safe summary for `mugiwara-control-panel` project health.
- Include local clean/aligned state and open issue/PR counts only if safely cached or queried with bounded output.
- Do not expose diffs, file paths, remotes beyond public-safe repo URL or raw Git/GitHub output.

DoD:
- Project health signal appears in Healthcheck and Dashboard aggregation.
- Tests cover clean, dirty, behind/ahead, unknown GitHub state.

Review:
- Franky + Chopper.

### Phase 15.5 — Hermes gateways safe adapter
Scope:
- Add allowlisted systemd user service summary for global Hermes gateway and per-Mugiwara gateway health.
- Required service IDs: `hermes-gateway-<slug>.service` for known slugs.

DoD:
- No PIDs, command lines, unit files, logs or paths exposed.
- Per-Mugiwara cards/signals are stable and agent-readable.
- Global gateway health derives from per-gateway summaries.

Review:
- Franky mandatory.
- Chopper mandatory.

### Phase 15.6 — Cronjobs health contract and adapter
Scope:
- Define or consume a sanitized active-cronjobs manifest.
- Show active cronjob health and last run/freshness per critical job.
- Exclude prompt bodies, commands, chat IDs, logs and outputs.

DoD:
- Healthcheck shows cronjobs active/stale/missing with short warnings.
- The source is explicit and auditable.
- If no global cron manifest exists, endpoint shows `not_configured`/`stale` rather than guessing.

Review:
- Franky mandatory.
- Chopper mandatory.

### Phase 15.7 — Integration smoke, visual check and canon refresh
Scope:
- Run full backend/web verify.
- Smoke `/api/v1/healthcheck`, `/api/v1/dashboard`, `/healthcheck`, `/dashboard`.
- Confirm visible UI remains sane and no raw host details leak.
- Refresh vault Project Summary if the block materially changes project status.

DoD:
- Full Phase 15 block is closed or remaining source families are explicitly tracked as separate issues.

Review:
- Franky + Chopper; Usopp only if UI layout/copy changes materially.

## Source boundary rules

### Forbidden in API/UI output
- `.env` values, tokens, cookies, credentials.
- Raw command output, stdout, stderr, traceback, journal logs.
- Absolute host paths, backup archive paths, included backup paths.
- PIDs, process command lines, systemd unit contents.
- Cron prompt bodies, commands, delivery targets, chat IDs.
- Arbitrary Git diffs, untracked file lists, internal remote details.

### Allowed in API/UI output
- Stable check ID.
- Human label.
- `status` in allowlist.
- `severity` in allowlist.
- ISO freshness timestamp.
- Short sanitized warning text.
- Safe source label.
- Optional numeric counts if non-sensitive: open issue count, open PR count, expected/active gateway count, backup retention count.

## Data model direction
Healthcheck should keep the existing shape and enrich records rather than introduce a generic source browser:

```text
healthcheck.workspace
  summary_bar
  modules[]
  signals[]
  events[]
  principles[]
```

Suggested stable module IDs:
- `vault-sync`
- `project-health`
- `backup-health`
- `hermes-gateways`
- `gateway.<mugiwara-slug>`
- `cronjobs`

## Review and ownership
- Zoro owns software architecture and implementation.
- Franky should validate operational source semantics for vault sync, backup, gateways and cronjobs.
- Chopper should validate security boundary and leakage risk for every source family.
- Usopp only joins if UI layout/copy changes materially.

## Risks
- Host/runtime leakage if adapters expose raw command output or paths.
- False confidence if stale/missing source manifests render as healthy.
- Cross-profile cron health may be impossible from Zoro's local profile without a dedicated manifest.
- Gateway health can accidentally expose process metadata if systemd output is not strictly mapped.
- Backup health can leak archive paths or included sensitive paths if not summarized carefully.

## Recommended next action
Start with **Phase 15.2 — Health source contracts and registry**. Do not implement all requested sources at once. The first implementation PR should add the typed source contract and tests that make unsafe source expansion difficult.

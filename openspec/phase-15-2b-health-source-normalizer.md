# Phase 15.2b — Health source registry normalization and unsafe-field rejection

## Goal
Close the second implementation slice of the Phase 15.2 Healthcheck foundation by adding a backend-owned source registry/normalizer before future live adapters exist.

## Scope delivered
- Added `HealthcheckSourceRegistry` in `apps/api/src/modules/healthcheck/registry.py`.
- Added `HealthcheckSourceSnapshot` as the internal bridge between normalized adapter-like payloads and the existing `HealthcheckService` read model.
- Added `HealthcheckService.from_source_snapshots(...)` so future adapters can feed normalized records without bypassing Healthcheck validation.
- Ensured registry input copies only allowlisted fields:
  - `label`
  - `status`
  - `severity`
  - `updated_at`
  - `summary`
  - `warning_text`
  - `source_label`
  - `freshness_label`
  - `freshness_state`
- Dropped unknown/raw adapter-like fields before API/service serialization.
- Modeled absent, unreadable and unregistered source conditions explicitly as degraded states:
  - absent -> `not_configured`
  - unreadable -> `unknown`
  - unregistered -> `not_configured`
- Changed unsupported Healthcheck source ID errors so they do not echo the rejected raw value.

## Explicitly out of scope
- No live source adapters.
- No manifest reads.
- No filesystem reads or globbing.
- No Git/GitHub queries.
- No systemd, shell, Docker or subprocess access.
- No cronjob runtime visibility.
- No final freshness threshold policy; that remains Phase 15.2c.

## TDD notes
Added tests first for:
- missing `registry.py` import and registry normalizer API;
- unsafe adapter-like fields not leaking into service/API-shaped output;
- absent/unreadable/unregistered sources degrading visibly and never becoming `pass`;
- unsupported source ID errors not echoing the rejected source value.

The first targeted run failed on `ModuleNotFoundError: apps.api.src.modules.healthcheck.registry`, then implementation made the suite pass.

## Security boundary
This phase does not broaden host visibility. It only adds a deny-by-default normalization boundary for future adapters. Raw fields such as paths, URLs, commands, stdout/stderr, journals, prompts, chat IDs, credentials, cookies, `.env`, git diffs, untracked file lists and internal remote details are not part of the allowed output contract.

## Verify checklist
See `openspec/phase-15-2b-verify-checklist.md`.

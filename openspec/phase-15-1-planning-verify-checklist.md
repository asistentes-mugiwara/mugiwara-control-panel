# Phase 15.1 planning verify checklist — Healthcheck real sources

## Context checked
- [x] Repo status checked: `main` was aligned with `origin/main` before creating planning branch.
- [x] Open GitHub issues checked: none open before Phase 15.1 planning.
- [x] Open GitHub PRs checked: none open before Phase 15.1 planning.
- [x] Engram context checked for Phase 14.1 / issue #16 closure.
- [x] Vault Project Summary checked for current recommended next step.
- [x] Existing docs checked:
  - `docs/api-modules.md`
  - `docs/read-models.md`
  - `docs/observability-surface.md`
  - `openspec/phase-14-1-health-dashboard-source-hardening.md`
- [x] Existing operational scripts checked:
  - `/srv/crew-core/scripts/vault-sync.sh`
  - `/srv/crew-core/scripts/system-backup.sh`
- [x] Live system state sampled only for planning constraints:
  - user systemd gateway services exist for known Mugiwara profiles;
  - Zoro profile `cronjob list` currently returns no jobs, so global cron health needs explicit manifest/contract.

## User requirements captured
- [x] Vault sync health.
- [x] Last vault sync.
- [x] Project health.
- [x] Backup health.
- [x] Last backup.
- [x] Hermes gateway global health.
- [x] Gateway health per Mugiwara.
- [x] Active cronjobs health.

## Safety gates in plan
- [x] No generic host console.
- [x] No arbitrary command runner.
- [x] No client-provided path/URL/method.
- [x] No raw logs/stdout/stderr/systemd unit contents.
- [x] No backup archive paths or included paths in API/UI output.
- [x] No cron prompt bodies, commands, chat IDs or delivery targets.
- [x] Franky + Chopper review required for source families touching host/runtime.

## Phase cut
- [x] Planning explicitly avoids implementing all sources in one PR.
- [x] Phase 15.2 is defined as contracts/registry before live source adapters.
- [x] Source families are split into smaller PR-sized microphases.

## Verification
- [x] `git diff --check` — passed.
- [x] Review generated OpenSpec for accidental sensitive data — directed diff scan found 0 sensitive added hits.
- [x] Commit on branch `zoro/phase-15-1-healthcheck-real-sources-plan` — latest reviewed SHA `bcbaa24` before reviewer follow-up absorption.
- [x] Push branch and open PR — PR #29.

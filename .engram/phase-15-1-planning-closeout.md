# Phase 15.1 planning closeout — Healthcheck real sources

## Status
Planning in progress on branch `zoro/phase-15-1-healthcheck-real-sources-plan`.

## Summary
Phase 15.1 translates Pablo's requested Healthcheck scope into a safe implementation plan. The requested surfaces are:

- Vault sync health and last sync.
- Project health.
- Backup health and last backup.
- Hermes gateway global health.
- Gateway health per Mugiwara.
- Active cronjobs health.

## Planning decision
Do not implement all source families in one PR. The correct next implementation is Phase 15.2: contracts and source registry first. Then add source families in separate microphases:

1. Vault sync + local backup safe adapters.
2. Project health safe adapter.
3. Hermes gateway global/per-Mugiwara safe adapters.
4. Cronjobs health manifest/adapter.
5. Integration smoke and canon refresh.

## Source boundary
Every source must be explicit and allowlisted. Healthcheck must not become a generic host console. API/UI output may include only stable IDs, labels, status/severity, freshness timestamps, short warning text, source labels and safe counts.

Forbidden: raw command output, stdout/stderr, systemd unit contents, journal logs, PIDs, process command lines, backup archive paths, included backup paths, cron prompt bodies, cron commands, chat IDs, tokens, `.env` values or arbitrary host paths.

## Context used
- Phase 14.1 already hardened timestamp parsing and critical severity aggregation.
- `docs/api-modules.md` already positions Healthcheck as the module for cronjobs, backups and gateways.
- `scripts/vault-sync.sh` and `scripts/system-backup.sh` exist but do not yet provide ideal structured health manifests.
- User systemd currently shows Hermes gateway services for the active Mugiwara profiles.
- Zoro profile cronjob list is empty, so global active cronjob health must use an explicit shared manifest/source rather than profile-local inference.

## Verification status
- `git diff --check` passed.
- Directed diff scan for sensitive added values found 0 hits.
- Planning PR opened as #29.

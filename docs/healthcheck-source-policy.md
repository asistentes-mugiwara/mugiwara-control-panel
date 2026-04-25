# Healthcheck source policy

## Purpose
Phase 15.2c closes the final foundation slice before live Healthcheck source adapters. It defines the source-policy contract that later adapters must satisfy without adding live reads yet.

## No generic host console
Healthcheck must not become a generic host console. New source code in `apps/api/src/modules/healthcheck` must not introduce generic shell, process, command execution or arbitrary URL-fetch adapters without a reviewed, allowlisted phase.

Blocked by `npm run verify:healthcheck-source-policy`:
- generic subprocess or shell usage;
- `exec()` / `eval()` style execution;
- generic `requests`, `httpx` or `urllib.request` URL fetches inside the Healthcheck module;
- command-parameter based host adapters.

Adapters remain explicit, source-family-specific and reviewed. No live manifest reads are implemented in Phase 15.2c.

## Manifest ownership and safe location class
Future live adapters may consume only sanitized summaries from reviewed sources. They must never expose raw host details.

| Source family | Owner | Safe location class | Notes |
| --- | --- | --- | --- |
| `vault-sync` | Franky | Franky-owned operational source | Status manifest or wrapper maintained by operations. |
| `backup-health` | Franky | Franky-owned operational source | Status manifest or wrapper maintained by operations. |
| `cronjobs` | Franky | shared manifest registry, not Zoro profile-local `cronjob list` | Must represent global scheduled jobs safely, not one profile's local runtime view. |
| `hermes-gateways` | Franky | systemd user gateway summary | Aggregated gateway status only. |
| `gateway.<mugiwara-slug>` | Franky | allowlisted gateway status summary | One allowlisted process summary per Mugiwara slug. |
| `project-health` | Zoro | repo-local project health summary | Project health remains repo-scope and must not expose raw Git internals. |

Source manifests or wrappers do not include `stdout`, `stderr`, `raw_output`, `command`, `traceback`, `pid`, `unit_content`, `journal`, absolute host paths, `backup_path`, `included_path`, `prompt_body`, `chat_id`, delivery targets, tokens, cookies, credentials, `.env`, Git diffs, untracked file lists or internal remotes.

## Initial freshness thresholds
Thresholds are intentionally backend-owned policy before Phase 15.3+ live adapters start mapping timestamps to `pass`/`warn`/`fail`.

- `vault-sync`: warn after 90 minutes, fail after 360 minutes.
- `project-health`: warn after 120 minutes, fail after 480 minutes.
- `backup-health`: warn after 1800 minutes, fail after 4320 minutes.
- `hermes-gateways` and `gateway.<mugiwara-slug>`: warn after 15 minutes, fail after 60 minutes.
- `cronjobs`: warn after 180 minutes, fail after 720 minutes.

These thresholds are not applied to live data in Phase 15.2c. Future adapters must parse timestamps explicitly, normalize to the existing Healthcheck freshness vocabulary and degrade absent/unreadable data to `not_configured`, `unknown` or `stale`, never to healthy output.

## Verify
Run after changes that touch Healthcheck source adapters, docs or source-policy boundaries:

```bash
npm run verify:healthcheck-source-policy
```

For implementation phases that also touch the API read model, run the backend test suite and existing perimeter guardrails as well.

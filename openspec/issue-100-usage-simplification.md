# Issue 100 — Usage simplification, daily 5h windows and Hermes token aggregates

## Objective
Simplify `/usage` so it is operationally useful without exposing sensitive runtime data:

- one selectable local day at a time for the last seven days of 5h Codex windows;
- aggregated Hermes activity ranking with all Mugiwara profiles, including inactive profiles;
- aggregate Hermes token counters for the last week and all-time;
- remove the explanatory weekly Codex cycle container from the UI.

## Server boundary

- Keep Usage adapters server-only; browser code never receives backend URLs or runtime env values.
- `usage.five_hour_window_days` reads only the allowlisted Codex SQLite usage source and returns sanitized window aggregates.
- Windows that cross local midnight are assigned to the `Europe/Madrid` date where they spend the longest duration.
- `usage.hermes_activity` keeps `MUGIWARA_HERMES_PROFILES_ROOT` server-only, uses the Mugiwara profile allowlist, and opens Hermes SQLite state in read-only mode (`mode=ro`).
- Hermes tokens are exposed only as aggregate counters (`weekly_tokens_count`, `total_tokens_count`, per-profile aggregate `tokens_count`). Do not expose token rows, prompts, conversations, paths, IDs, chat targets, cookies, headers, logs, costs or raw payloads.

## UI contract

- `/usage` keeps a server-rendered page and delegates day selection to an isolated client component with already-sanitized props.
- The 5h window view shows one selected day and offers day selector tabs for the last seven days.
- The Hermes ranking is sorted from most used to least used and constrained to roughly five visible entries before vertical scrolling.
- Inactive Mugiwara profiles remain present with zeroed aggregate metrics.
- Remove the `Ciclo semanal Codex` explanatory container.

## Verify

- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q`
- `npm run verify:usage-server-only`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `git diff --check`
- Smoke API: `GET /api/v1/usage/five-hour-window-days`
- Smoke API: `GET /api/v1/usage/hermes-activity?range=7d`
- Smoke visual `/usage` privately via Tailscale before merge/deploy when possible.

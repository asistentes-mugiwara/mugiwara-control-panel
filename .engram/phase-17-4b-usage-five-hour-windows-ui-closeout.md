# Phase 17.4b closeout — Usage five-hour windows UI

## Scope
17.4b integrates the Phase 17.4a five-hour windows backend into `/usage` UI. It remains server-only/read-only and does not add Hermes activity.

## Implemented
- `fetchUsageFiveHourWindows(8)` in the server-only Usage adapter.
- Fallback fixture for five-hour windows.
- `/usage` panel `Ventanas 5h históricas` with start/end, peak, intra-window delta, samples, status and peak progress bar.
- Responsive CSS for the windows list.
- `verify:usage-server-only` now fixes the five-hour windows endpoint and UI strings.
- Backend regression test for invalid `limit` values, covering Chopper's PR #74 nonblocking follow-up.

## Deferred
- Hermes activity backend aggregation and UI, still separated for 17.4c/17.4d.

## Verify
- `npm run verify:usage-server-only`.
- `npm --prefix apps/web run typecheck`.
- `npm --prefix apps/web run build` confirmed `/usage` remains dynamic (`ƒ`).
- `npm run verify:visual-baseline`.
- `PYTHONPATH=. pytest apps/api/tests/test_usage_api.py -q` → 9 passed.
- `git diff --check`.
- Browser smoke `/usage` against local branch API (`127.0.0.1:8010`) and web (`127.0.0.1:3011`): real API mode, windows panel visible, console clean, no horizontal overflow.

# Phase 15.3 prerequisite — Healthcheck text field sanitization

## Objective
Close GitHub issue #34 before adding any live Healthcheck adapters. The microphase hardens the Healthcheck source registry so allowed textual fields cannot leak host paths, secrets, raw command output or internal runtime details.

## Scope
- Add a defense-in-depth sensitive-marker filter in `HealthcheckSourceRegistry` for `summary`, `warning_text`, `source_label` and `freshness_label`.
- Preserve source semantics (`status`, `severity`, `freshness_state`, `updated_at`) while replacing unsafe text with generic safe fallbacks.
- Add regression tests that inject sensitive content inside allowed textual fields and verify the serialized workspace remains sanitized.
- Expand `npm run verify:healthcheck-source-policy` to assert the sanitizer contract and block generic filesystem discovery/read patterns in the Healthcheck module.
- Update docs for source policy and read model expectations.

## Non-goals
- No live manifest reads.
- No vault-sync, backup, gateway or cronjob adapters.
- No generic filesystem, shell, systemd, Docker or network probing.
- No auth/public perimeter changes.

## Defensive behavior
Allowed textual fields are not rejected wholesale. If their value contains sensitive markers such as host paths, `.env`, token/credential/cookie terms, stdout/stderr/raw output, commands, tracebacks, journals, prompts, chat IDs, delivery targets, Git diffs, untracked files or internal remotes, the registry substitutes a generic fallback. That keeps the check visible but removes unsafe text from the API read model.

## Verification
Executed from repo root:

```bash
python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/registry.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py
python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
python -m pytest apps/api/tests -q
npm run verify:healthcheck-source-policy
npm run verify:perimeter-policy
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
git diff --check
```

## Review
Because this touches Healthcheck security boundary and static policy guardrails, request Chopper + Franky review before merge.

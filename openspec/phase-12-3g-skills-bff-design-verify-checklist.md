# Phase 12.3g — planning verify checklist

Checked at `2026-04-24T13:45:31+02:00`.

## Repository context
- [x] Repo root verified: `/srv/crew-core/projects/mugiwara-control-panel`.
- [x] Local Git identity configured as `zoro` with Mugiwara hooks.
- [x] Started from clean `main` aligned with `origin/main` at merge commit `3674537`.
- [x] Work branch created: `zoro/phase-12-3g-skills-bff-design`.

## Source inspection
- [x] Read Phase 12.3e migration plan.
- [x] Read current runtime config docs.
- [x] Inspected current browser skills adapter: `apps/web/src/modules/skills/api/skills-http.ts`.
- [x] Inspected current `/skills` client page state machine and env copy.
- [x] Inspected FastAPI skills router and service policy.
- [x] Inspected shared skills contract types.

## Design coverage
- [x] Pattern selected: Next.js route handlers as same-origin BFF.
- [x] Server actions explicitly deferred.
- [x] Exact BFF endpoints listed.
- [x] `skillId` validation rule specified.
- [x] Method allowlist policy specified.
- [x] `Content-Type` validation specified for write-like routes.
- [x] Body size cap specified.
- [x] Preview/update payload schemas specified.
- [x] Error sanitization envelope and code set specified.
- [x] Logging denylist specified.
- [x] `cache: no-store` policy specified.
- [x] Cookie/auth/CSRF future boundary documented.
- [x] Phase 12.3h implementation order documented.
- [x] Future `verify:skills-server-only` guardrail requirements documented.

## Scope control
- [x] No runtime code changed in this phase.
- [x] No auth model introduced.
- [x] No backend policy weakened.
- [x] No new write capability introduced.
- [x] No secrets, env values, dumps or logs added.

## Verify performed
- [x] `git diff --check`
- [x] `npm run verify:memory-server-only`
- [x] `npm run verify:mugiwaras-server-only`
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`
- [x] `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py` → `15 passed`

## Review routing
- [x] Chopper required for security boundary and write-surface risk.
- [x] Franky required for runtime config, route handlers and guardrails.
- [x] Usopp not required unless later implementation changes visible UX materially.

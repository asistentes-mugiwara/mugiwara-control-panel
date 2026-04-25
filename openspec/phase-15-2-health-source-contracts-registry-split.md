# Phase 15.2 — Health source contracts and registry split

## Decision
Phase 15.2 **must be split into smaller subphases** before implementation.

Phase 15.1 correctly defined Phase 15.2 as the safety foundation before live Healthcheck sources. After re-reading the merged plan, current Healthcheck backend code and reviewer follow-ups, the Phase 15.2 scope is still too broad for one implementation PR because it mixes:

- new backend domain contracts and stable source/check IDs;
- registry and normalization semantics;
- negative security tests for unsafe client/raw fields;
- guardrails against generic host adapters;
- documentation updates;
- manifest ownership/location decisions;
- freshness threshold policy by source family.

There are still **no live host reads** in Phase 15.2, but the foundation creates the rules that later live adapters will depend on. A mistake here would either block later adapters or create a host-leakage escape hatch. Split it.

## Current baseline used
- Branch baseline: `main` at merge commit `4e4f561` from PR #29.
- Existing Healthcheck backend lives in `apps/api/src/modules/healthcheck/domain.py` and `service.py` with fixture-backed `HealthcheckRecord` values.
- Existing tests are concentrated in `apps/api/tests/test_healthcheck_dashboard_api.py` and already cover sanitized workspace output, empty-source `not_configured`, stale visibility and timestamp aggregation.
- `docs/api-modules.md` still says Healthcheck consumes only safe catalog sources and must not execute shell/systemd/Docker or read raw host output.
- `docs/read-models.md` defines semantic states but does not yet describe the Phase 15 source registry/family model.
- Phase 15.1 reviewer follow-ups require explicit absent/unreadable/unregistered semantics, negative tests for unsafe fields, generic adapter guardrails, manifest ownership/location and freshness thresholds.

## Subphase cut

### Phase 15.2a — Source contract vocabulary and stable IDs

Scope:
- Add or refine backend domain vocabulary for Healthcheck source families without adding live adapters.
- Define stable family IDs and check IDs for Phase 15 source families:
  - `vault-sync`
  - `project-health`
  - `backup-health`
  - `hermes-gateways`
  - `gateway.<mugiwara-slug>`
  - `cronjobs`
- Define allowed status/severity/freshness state vocabularies in one backend-owned place.
- Keep current fixture-backed output compatible.
- Update `docs/read-models.md` with the source-family vocabulary.

Out of scope:
- Manifest reading.
- Filesystem reads.
- Git/GitHub queries.
- systemd queries.
- cronjob runtime visibility.
- New web UI layout.

DoD:
- Existing API payload shape remains compatible for `/api/v1/healthcheck` and `/api/v1/dashboard`.
- Invalid status/severity/freshness values cannot silently become healthy output.
- Source/check IDs are deterministic and come only from backend-owned allowlists; they are never derived from client input, discovered paths or dynamically detected service names.
- Tests cover allowed vocabulary and invalid-value degradation/rejection.

Verify:
```bash
python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
npm run verify:health-dashboard-server-only
npm run verify:perimeter-policy
git diff --check
```

Review:
- Chopper + Franky recommended because this becomes the safety contract for live host sources.

### Phase 15.2b — Registry normalization and unsafe-field rejection

Scope:
- Introduce a small backend-owned source registry/normalizer for records supplied by future adapters.
- Model absent, unreadable and unregistered source states explicitly as `not_configured`, `unknown` or `stale`, never `pass`.
- Add tests that malicious/raw adapter-like input cannot leak fields such as:
  - client-provided `path`, `url`, `method`;
  - `stdout`, `stderr`, `raw_output`, `command`, `traceback`;
  - `pid`, `unit_content`, `journal`;
  - absolute host paths, `backup_path`, `included_path`;
  - `prompt_body`, `chat_id`, delivery targets;
  - `token`, cookies, credentials, `.env`;
  - Git diffs, untracked file lists or internal remote details.

Out of scope:
- Real source adapters.
- Calling subprocess, shell, systemd, GitHub API or filesystem globbing.
- Deciding final thresholds if not needed by the normalizer API.

DoD:
- Registry output serializes only allowlisted Healthcheck fields.
- Unknown/raw fields are dropped or rejected before API serialization.
- Missing/unreadable/unregistered sources are visible as degraded/not-configured states.
- Tests prove unsafe inputs do not appear in nested API/service output.

Verify:
```bash
python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
npm run verify:health-dashboard-server-only
npm run verify:perimeter-policy
git diff --check
```

Review:
- Chopper mandatory.
- Franky recommended.

### Phase 15.2c — Guardrails, manifest ownership and freshness policy

Scope:
- Add a static guardrail or registry test that blocks generic host adapters in Healthcheck until explicitly reviewed.
- Block suspicious patterns outside reviewed allowlisted files, for example `command`, `shell`, `exec`, `subprocess` and generic URL fetch usage in Healthcheck source code.
- Document manifest ownership and safe locations before live adapters:
  - vault sync status manifest/wrapper: Franky-owned operational source;
  - backup status manifest/wrapper: Franky-owned operational source;
  - cronjobs status manifest/registry: Franky-owned shared source, not inferred from Zoro profile-local `cronjob list`.
- Define initial freshness thresholds by family before rendering pass/warn/fail in live adapters.
- Wire the guardrail into package scripts if it is static and cheap.

Out of scope:
- Reading those manifests.
- Implementing thresholds against live data.
- Changing Dashboard aggregation beyond compatibility needs.

DoD:
- There is a reproducible guardrail command or test preventing accidental generic host-console growth.
- Docs state owner, safe location class and sensitivity exclusions for each manifest family.
- Freshness thresholds exist for vault sync, backup, cronjobs and gateways before Phase 15.3+ live reads.
- `docs/api-modules.md` and/or a dedicated Healthcheck source doc reflect the policy.

Verify:
```bash
python -m py_compile apps/api/src/modules/healthcheck/domain.py apps/api/src/modules/healthcheck/service.py apps/api/tests/test_healthcheck_dashboard_api.py
PYTHONPATH=. python -m pytest apps/api/tests/test_healthcheck_dashboard_api.py -q
npm run verify:health-dashboard-server-only
npm run verify:perimeter-policy
npm run verify:healthcheck-source-policy
git diff --check
```

Review:
- Franky mandatory for source ownership/runtime feasibility.
- Chopper mandatory for guardrail and leakage risk.

## Why not one Phase 15.2 PR
A single PR would be technically possible, but worse operationally:

1. The diff would mix domain model changes, safety semantics, guardrails and docs policy.
2. Reviewers would have to validate both code-level leakage controls and ops ownership decisions at once.
3. TDD would become less crisp: failures in vocabulary, normalizer semantics or guardrail scanning would be harder to isolate.
4. Later live-source phases depend on the contract being stable; smaller subphases reduce rollback risk.

## Numbering policy
Keep the already-planned live-adapter phases stable:

- 15.2a / 15.2b / 15.2c close the contracts/registry foundation.
- 15.3 remains vault sync + local backup adapters.
- 15.4 remains project health adapter.
- 15.5 remains Hermes gateway adapters.
- 15.6 remains cronjobs health adapter.
- 15.7 remains integration smoke/canon refresh.

## Recommended next action
Start implementation with **Phase 15.2a** only. Do not touch manifests, shell/systemd/Git, cronjobs or live source reads in 15.2a.

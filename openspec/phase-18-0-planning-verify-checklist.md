# Phase 18.0 — planning verify checklist

## Scope
Planning/reconciliation only. No live producers, no timers, no backend behavior changes.

## Discovery performed
- [x] Repo status checked from canonical root.
- [x] GitHub open issues checked.
- [x] GitHub open PRs checked.
- [x] Project Summary checked.
- [x] Engram checked.
- [x] Healthcheck adapters/readers checked.
- [x] Existing producer scripts checked.
- [x] Existing systemd user runners checked.
- [x] Runtime healthcheck manifest directory checked without committing host outputs.

## Reconciled state
- [x] Phase 17 is Usage and #51 is closed by PR #77.
- [x] Phase 18.x is the canonical block for pending Healthcheck producers.
- [x] #40 Git control page remains separate.
- [x] #36 header metrics remains separate.
- [x] `vault-sync-status.json` and `backup-health-status.json` producers are still pending.
- [x] Backend already has fixed manifest readers for both sources.

## Planning outputs
- [x] `openspec/phase-18-0-healthcheck-producers-planning.md` defines microfases 18.1–18.5.
- [x] `openspec/phase-18-healthcheck-producers-roadmap.md` reconciled with closed Phase 17 state.
- [x] `.engram/phase-18-0-healthcheck-producers-planning-closeout.md` created for continuity.
- [x] DoD and verify defined per microfase.
- [x] Sources, manifests, permissions, ownership, schema minimum and risks documented.

## Verify commands
- [x] `npm run verify:healthcheck-source-policy` — passed.
- [x] `git diff --check` — passed.

## Review
- [ ] PR opened.
- [ ] Handoff comment left in PR.
- [ ] Franky invoked for operational/runtime review.
- [ ] Chopper invoked for security/no-leakage review.
- [ ] Reviewer responses handled before considering 18.0 closed.

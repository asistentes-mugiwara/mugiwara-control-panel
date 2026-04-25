# Phase 15.2 split planning verify checklist

## Context checked
- [x] `git status --short --branch` from repo root.
- [x] Recent Git history through merged Phase 15.1 PR #29.
- [x] Merged `openspec/phase-15-1-healthcheck-real-sources-plan.md`.
- [x] `.engram/phase-15-1-planning-closeout.md` reviewer follow-ups.
- [x] Current Healthcheck backend domain/service code.
- [x] Current Healthcheck/Dashboard backend tests.
- [x] Relevant docs: `docs/api-modules.md`, `docs/read-models.md`.

## Decision checks
- [x] Phase 15.2 was evaluated against current code and reviewer follow-ups, not only memory.
- [x] Decision is explicit: split Phase 15.2 into 15.2a, 15.2b and 15.2c.
- [x] Split avoids live host reads in all 15.2 subphases.
- [x] Existing Phase 15.3+ numbering remains stable.
- [x] Chopper + Franky review need is preserved for the sensitive foundation.

## Safety checks included in the plan
- [x] Client-provided `path`, `url`, `method` must be rejected/ignored before serialization.
- [x] Raw/sensitive fields must not serialize: `stdout`, `stderr`, `raw_output`, `command`, `pid`, `unit_content`, `journal`, `backup_path`, `included_path`, `prompt_body`, `chat_id`, `token`, `.env`.
- [x] Missing/unreadable/unregistered sources must map to `not_configured`, `unknown` or `stale`, never healthy.
- [x] Generic host adapters must be blocked unless explicitly reviewed.
- [x] Manifest ownership/location and freshness thresholds remain required before live adapters.

## Verification run for this planning split
- [x] `git diff --check`

## Not run
- [ ] Backend/web test suite — not required for planning-only docs, no runtime code changed.
- [ ] Browser visual smoke — not required, no UI changed.

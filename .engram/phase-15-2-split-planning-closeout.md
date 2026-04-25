# Phase 15.2 split planning closeout

## Status
Planning split created for Phase 15.2 on branch `zoro/phase-15-2-split-plan`.

## Decision
Phase 15.2 should not be implemented as one broad PR. It is now split into:

1. **15.2a — Source contract vocabulary and stable IDs**
   - backend-owned source/check ID vocabulary;
   - status/severity/freshness allowlists;
   - no live reads.

2. **15.2b — Registry normalization and unsafe-field rejection**
   - registry/normalizer;
   - absent/unreadable/unregistered semantics;
   - negative tests against raw fields, client-provided path/url/method, cookies/credentials, tracebacks, absolute host paths, Git diffs/untracked lists/internal remotes and delivery targets.

3. **15.2c — Guardrails, manifest ownership and freshness policy**
   - static guardrail/test against generic host adapters;
   - manifest ownership/location policy;
   - source-family freshness thresholds.

## Rationale
The merged Phase 15.1 plan correctly made Phase 15.2 the contracts/registry foundation before live source adapters. However, after inspecting current Healthcheck code and the absorbed Franky/Chopper follow-ups, the foundation still mixes too many safety responsibilities for one PR. Splitting improves reviewability, TDD focus and rollback safety before touching vault sync, backups, gateways or cronjobs.

## Next implementation step
Start with **Phase 15.2a** only. Keep the scope to backend contract vocabulary and docs. Do not implement manifests, filesystem/Git/systemd/shell reads, cronjob visibility or UI redesign.

## Verification
Planning-only verify:
- `git diff --check` passed.

Runtime tests were intentionally not run because no runtime code changed in this split-planning step.

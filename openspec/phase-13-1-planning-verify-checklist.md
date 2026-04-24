# Phase 13.1 planning verify checklist

## Repository state
- [x] Planned from project root: `/srv/crew-core/projects/mugiwara-control-panel`.
- [x] Started from `main...origin/main` clean.
- [x] Open issues checked: only #16 remains open.
- [x] Recent canon checked: Phase 12.8 points next block at Phase 13 perimeter/auth/BFF hardening.

## Context inspected
- [x] Engram recent observations for Phase 12.6c, 12.7 and 12.8.
- [x] Vault Project Summary current next-step recommendation.
- [x] `docs/runtime-config.md` current server-only/BFF contract.
- [x] `openspec/phase-12-3g-skills-bff-design.md` future Origin/CSRF boundary.
- [x] Current web/API/script structure for affected surfaces.

## Planning decisions
- [x] Phase 13 should be split into subphases.
- [x] Phase 13.1 is planning/design only.
- [x] Phase 13.2 defines perimeter/runtime policy before enforcement.
- [x] Phase 13.3 hardens the write-capable Skills BFF.
- [x] Phase 13.4 reviews backend/API perimeter and error behavior.
- [x] Phase 13.5 closes the block with smoke/canon.
- [x] #16 Healthcheck real-source work stays out of Phase 13 until perimeter guardrails exist.

## Verify executed
- [x] `git diff --check`
- [x] targeted sensitive-content scan for new planning files

## Review routing
- [x] Chopper required for security boundary/auth/CSRF/origin plan.
- [x] Franky required for runtime/private deployment feasibility and verify strategy.
- [x] Usopp not required unless future subphases change visible UI/copy materially.

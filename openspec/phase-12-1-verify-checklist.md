# Phase 12.1 verify checklist

- [x] SDD attempted through OpenCode with `sdd-orchestrator-zoro`.
- [x] OpenCode headless stalled during lightweight init/explore with no worktree changes; phase recovered inline using local SDD skills and TDD discipline.
- [x] RED observed: `PYTHONPATH=. pytest apps/api/tests/test_shared_contracts.py` failed before implementation because `ALLOWED_RESOURCE_STATUSES` did not exist.
- [x] GREEN observed: `PYTHONPATH=. pytest apps/api/tests/test_shared_contracts.py` passed after implementation.
- [x] No new API endpoints introduced.
- [x] No filesystem/vault/host access introduced.
- [x] Full backend test suite: `python -m py_compile apps/api/src/shared/contracts.py apps/api/tests/test_shared_contracts.py && PYTHONPATH=. pytest apps/api/tests`.
- [x] TypeScript contracts compile directly: `npx --prefix apps/web tsc --noEmit --strict --moduleResolution bundler --module esnext --target es2017 packages/contracts/src/resource.ts packages/contracts/src/read-models.ts`.
- [x] `npm --prefix apps/web run typecheck`.
- [x] `npm --prefix apps/web run build`.
- [x] `git diff --check`.

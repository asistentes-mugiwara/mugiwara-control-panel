# Phase 12.7 — Next/PostCSS audit follow-up

## Source
- GitHub issue: #17 — Audit existing Next/PostCSS moderate advisory.
- Origin: Chopper security review on PR #15 detected `next -> postcss` moderate advisory `GHSA-qx2v-qp2m-jg93`.

## Scope
- Re-run the frontend dependency audit without using `npm audit fix --force`.
- Keep the current Next.js 15 line because Next 16 requires Node `>=20.9.0`, while this runtime is on Node `v18.19.1`.
- Patch the transitive PostCSS advisory by forcing `postcss@8.5.10` through npm `overrides`.
- Add a committed npm lockfile so the dependency tree is auditable and reproducible.
- Add a root `audit:web` script that runs the frontend audit from the workspace-aware app directory.

## Decision
Use a focused npm override instead of a Next major upgrade:

```json
"overrides": {
  "postcss": "8.5.10"
}
```

Rationale:
- The vulnerable range is `postcss <8.5.10`.
- `next@15.5.15` still declares `postcss@8.4.31`.
- `next@16.2.4` is not a safe patch for the current runtime because it requires Node `>=20.9.0`.
- The build and typecheck pass with PostCSS `8.5.10` under Next `15.5.15`.

## Verification
Executed on 2026-04-24:

```bash
npm run audit:web
npm run typecheck:web
npm run build:web
```

Results:
- `npm run audit:web`: `found 0 vulnerabilities`.
- `npm run typecheck:web`: passed.
- `npm run build:web`: passed with Next.js `15.5.15`.

## Notes
- `npm --prefix apps/web audit` does not work reliably in this npm workspace because it looks for a lockfile inside `apps/web`; `cd apps/web && npm audit` correctly resolves the root workspace lockfile.
- Do not replace this with `npm audit fix --force`; npm suggests a semver-major downgrade path to `next@9.3.3`, which is not acceptable.

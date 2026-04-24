# Phase 13.3 verify checklist — Skills BFF hardening

## Static guardrails
- [ ] `npm run verify:perimeter-policy`
- [ ] `npm run verify:skills-server-only`

## Type/build
- [ ] `npm --prefix apps/web run typecheck`
- [ ] `npm --prefix apps/web run build`

## Security review points
- [ ] `MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS` is server-only only.
- [ ] No `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS` exists.
- [ ] `PUT /api/control-panel/skills/[skillId]` rejects before body parsing when Origin is absent/untrusted/unconfigured.
- [ ] `POST /api/control-panel/skills/[skillId]/preview` rejects before body parsing when Origin is absent/untrusted/unconfigured.
- [ ] Browser adapter remains same-origin BFF only.
- [ ] BFF does not forward browser `Cookie` or `Authorization` upstream.
- [ ] No generic proxy pattern was introduced.
- [ ] Docs still mark `internet-public` as unsupported.

## Repository hygiene
- [ ] `git diff --check`
- [ ] Changed docs/scripts scanned for secrets.
- [ ] Commit uses Zoro trailers.
- [ ] PR requests Chopper + Franky review.

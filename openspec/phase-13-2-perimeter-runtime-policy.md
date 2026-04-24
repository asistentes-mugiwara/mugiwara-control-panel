# Phase 13.2 — Perimeter contract and runtime policy

## Goal
Materialize the Phase 13 perimeter contract before enforcing Origin/CSRF or backend hardening in later phases.

## Why now
Phase 13.1 established that perimeter hardening must start with contract and runtime policy. Without this step, Phase 13.3 could add brittle Origin/CSRF checks without a clear trusted-origin model for local/private/Tailscale deployments.

## Scope
- Add `docs/security-perimeter.md` as the source document for the supported access model.
- Update `docs/runtime-config.md` to link the perimeter contract and make `internet-public: unsupported` explicit.
- Add `npm run verify:perimeter-policy` as a static guardrail for the contract.
- Keep runtime behavior unchanged.
- Record closeout continuity in `.engram/phase-13-2-closeout.md`.

## Contract decisions
- Supported access is private by default: local development, trusted private LAN and Tailscale/private access.
- Public internet exposure is unsupported until auth, session, CSRF and rate-limit decisions exist.
- `MUGIWARA_CONTROL_PANEL_API_URL` remains server-only and may only target loopback/private/Tailscale style backends; it must not leak into browser code or UI.
- Phase 13.2 does not implement a backend host allowlist. It defines the future decision point.
- Trusted origins are defined as a policy model now; enforcement belongs to Phase 13.3.
- `/skills` remains the only MVP write-capable surface and the first enforcement target.
- #16 Healthcheck real-source work remains after perimeter hardening.

## Guardrail
`npm run verify:perimeter-policy` checks that:
- `docs/security-perimeter.md` contains private-by-default, Tailscale and `internet-public: unsupported` policy;
- `docs/runtime-config.md` links the perimeter contract and verify command;
- `package.json` exposes the guardrail;
- Skills browser adapter still uses same-origin BFF and no backend env;
- Skills write BFF routes do not contain obvious browser credential/header forwarding snippets;
- Skills server adapter does not forward arbitrary caller headers upstream;
- Skills BFF does not contain obvious generic-proxy snippets.

## Non-goals
- No auth implementation.
- No Origin/CSRF enforcement yet.
- No CORS/header changes.
- No backend host allowlist implementation.
- No UI changes.
- No Healthcheck real-source connectors.

## Verify expected
```bash
npm run verify:perimeter-policy
npm run verify:skills-server-only
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
git diff --check
```

## Review routing
- **Chopper:** required. The PR defines security boundary, unsupported public exposure, trusted origins policy and no credential forwarding assumptions.
- **Franky:** required. The PR defines runtime/private deployment policy and adds a static guardrail.
- **Usopp:** not required because there is no UI/copy surface beyond internal docs.

## Follow-up handoff
Phase 13.3 should implement enforcement for write-capable Skills BFF routes using the policy defined here. It must not hardcode fragile origins without a config strategy; it should convert this contract into deterministic tests/guardrails.

# Phase 13.3 — Skills BFF hardening

## Goal
Harden the write-capable `/skills` BFF boundary before connecting additional real operational sources.

## Scope
In scope:

- server-only trusted-origin configuration for Skills write routes;
- Origin-based CSRF/perimeter rejection for `/api/control-panel/skills/**` write endpoints;
- deterministic guardrails that prevent regression to browser-exposed config or open proxy patterns;
- runtime docs describing the new required configuration.

Out of scope:

- full user authentication/session management;
- cookie-backed CSRF token design;
- public internet support;
- healthcheck/dashboard real-source hardening (#16);
- backend host allowlist beyond existing `http:`/`https:` validation.

## Design

### Configuration
`MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS` is a server-only comma-separated allowlist of exact `http:`/`https:` origins.

Examples of valid classes of values:

- local development origin;
- controlled private LAN origin;
- private Tailscale origin.

No `NEXT_PUBLIC_*` variant is allowed.

### Enforcement
Write-capable Skills BFF routes now call `assertTrustedOriginForSkillsWrite(request)` before reading or parsing request bodies.

Rejection model:

- no configured trusted origins -> `403 trusted_origins_not_configured`;
- missing `Origin` -> `403 origin_required`;
- invalid/non-allowlisted `Origin` -> `403 origin_not_allowed`.

The allowed path continues into the existing validations:

- exact BFF endpoints only;
- `skillId` validation;
- `application/json` validation;
- body size/content/schema validation;
- FastAPI remains source of truth for allowlist/path/write/audit policy.

### CSRF stance
The current MVP has no browser cookie/session auth and the BFF does not forward browser `Cookie` or `Authorization` upstream. Phase 13.3 therefore uses strict Origin validation as the CSRF/perimeter control for write routes.

If future auth uses browser cookies, add a separate CSRF token/session strategy before treating cookie-backed writes as protected.

## Files changed

- `apps/web/src/modules/skills/api/skills-bff-validation.ts`
  - adds server-only trusted-origin parsing and rejection helper;
  - keeps existing BFF validation payload shape.
- `apps/web/src/app/api/control-panel/skills/[skillId]/route.ts`
  - enforces trusted Origin before `PUT` body parsing/upstream update.
- `apps/web/src/app/api/control-panel/skills/[skillId]/preview/route.ts`
  - enforces trusted Origin before `POST` body parsing/upstream preview.
- `scripts/check-perimeter-policy.mjs`
  - extends perimeter guardrail to cover trusted origins and write-route enforcement.
- `scripts/check-skills-server-only.mjs`
  - extends Skills BFF guardrail to require server-only perimeter module and write-route Origin checks.
- `docs/security-perimeter.md`
  - records Phase 13.3 enforcement model.
- `docs/runtime-config.md`
  - documents `MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS`.

## Verify
Required before PR:

```bash
npm run verify:perimeter-policy
npm run verify:skills-server-only
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
git diff --check
```

Also scan changed docs/scripts for accidental secrets before commit.

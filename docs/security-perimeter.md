# Security perimeter and runtime policy

## Purpose
This document defines the supported perimeter for `mugiwara-control-panel` before Phase 13 implements enforcement changes.

The panel is a private Mugiwara/Hermes control plane. It observes and edits local operational surfaces, including the write-capable Skills MVP surface. It is not designed as a public internet application in the current MVP.

## Supported access model
Supported today:

| Mode | Status | Notes |
| --- | --- | --- |
| `localhost` / `127.0.0.1` development | supported | Default local development mode. |
| Private LAN | conditionally supported | Acceptable only on a trusted private network controlled by Pablo. |
| Tailscale private access | supported target | Preferred remote/private access model for real use. |
| Reverse proxy inside the private perimeter | conditionally supported | Must preserve the same private-only assumption and avoid public internet exposure. |
| Tailscale Funnel / public internet | unsupported | Unsupported until auth, session, CSRF and rate-limit policy exist. |

`internet-public: unsupported` is intentional. Do not expose the control panel to the public internet by only relying on route naming, hidden URLs, browser UX, or assumed obscurity.

## Trust boundary
- FastAPI remains the backend security boundary for filesystem, allowlists, write policy and sanitized read models.
- Next.js server-only adapters and BFF route handlers are exposure boundaries, not policy replacements.
- Browser/client code is not trusted for authorization, filesystem paths, backend URLs, write permission or safety decisions.
- `/skills` is the only MVP write-capable surface; it receives the strictest perimeter treatment.

## Backend base URL policy
`MUGIWARA_CONTROL_PANEL_API_URL` is server-only.

Rules:
- It must not be exposed through `NEXT_PUBLIC_*` variables.
- It may use only `http:` or `https:` schemes.
- It should normally point to loopback, private LAN or Tailscale/private hostnames.
- It must not be rendered in the UI, docs examples with real hostnames, browser errors, logs or frontend bundles.
- Invalid or missing values must degrade to sanitized `not_configured` / fallback states, never raw exceptions.

Phase 13.2 does not add a hard backend host allowlist. That belongs to a later enforcement phase if deployment hardening needs it. This phase defines the contract and guardrails.

## Trusted origins policy
Phase 13.3 enforces a configurable trusted-origin allowlist for write-capable Skills BFF routes.

Configuration:

- `MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS` is server-only.
- The value is a comma-separated list of exact `http:` / `https:` origins, for example local/private origins without paths.
- Public internet origins remain unsupported until auth/session/rate-limit decisions exist.
- Wildcards, arbitrary reflected origins and browser-controlled allowlists are not supported.

Enforcement for `/api/control-panel/skills/**` write routes:

- missing allowlist -> `403 trusted_origins_not_configured`;
- missing `Origin` -> `403 origin_required`;
- invalid or non-allowlisted `Origin` -> `403 origin_not_allowed`;
- allowed `Origin` -> request may continue to the existing schema/body/skill-id validation and backend write policy.

The current CSRF strategy is Origin-based because the MVP has no browser cookie/session auth yet and the BFF does not forward browser cookies or `Authorization` upstream. If future authentication uses cookies, add a separate CSRF token/session strategy before treating cookie-backed writes as protected.

## Skills BFF policy
The Skills BFF remains same-origin and allowlisted:

- Browser code calls only `/api/control-panel/skills/**`.
- BFF route handlers call exact FastAPI endpoints.
- No route may accept arbitrary `path`, `url`, `target` or `method` from user input.
- Browser cookies must not be forwarded upstream by default.
- Browser `Authorization` headers must not be forwarded upstream by default.
- Request bodies, diffs, hashes, skill contents and backend paths must not be logged or returned in sanitized errors.

If future authentication uses cookies, add a separate CSRF token/session strategy before treating cookie-backed BFF write routes as protected. Phase 13.3 only enforces the current non-cookie MVP boundary with strict Origin validation.

## Error and logging policy
Allowed in errors/logs:
- route or module name;
- HTTP status;
- sanitized error code;
- duration;
- validated skill id where required for audit.

Forbidden in errors/logs:
- backend base URL;
- filesystem paths;
- `.env` content;
- tokens, cookies, credentials or API keys;
- request bodies;
- skill contents;
- diff previews;
- `expected_sha256` or hashes;
- raw host command output, stdout/stderr, Docker/systemd/log excerpts.

## Relationship with #16
Issue #16, Healthcheck/Dashboard real-source hardening, stays after perimeter hardening. Real host health sources must not be connected until the control panel has a clearer perimeter and rejection model.

## Verify
Run this static policy guardrail after changes that touch perimeter docs, runtime config or Skills BFF boundaries:

```bash
npm run verify:perimeter-policy
```

When implementation changes touch Skills BFF, also run:

```bash
npm run verify:skills-server-only
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
```

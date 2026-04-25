# Phase 13.5 verify checklist — Perimeter block smoke and closeout

## Context
Branch: `zoro/phase-13-5-perimeter-block-closeout`

Purpose: prove the Phase 13 perimeter block can close without regressing Phase 12 read-only/backend-backed surfaces or reopening public-exposure risk.

## Verification commands

### Backend tests
```bash
PYTHONPATH=. python -m pytest apps/api/tests -q
```
Result: `30 passed in 0.57s`.

### Python compile check
```bash
python -m py_compile \
  apps/api/src/main.py \
  apps/api/src/modules/skills/router.py \
  apps/api/src/modules/skills/service.py \
  apps/api/src/modules/mugiwaras/router.py \
  apps/api/src/modules/memory/router.py \
  apps/api/src/modules/vault/router.py \
  apps/api/src/modules/healthcheck/router.py \
  apps/api/src/modules/dashboard/router.py
```
Result: passed.

### Static guardrails
```bash
npm run verify:perimeter-policy
npm run verify:skills-server-only
npm run verify:memory-server-only
npm run verify:mugiwaras-server-only
npm run verify:vault-server-only
npm run verify:health-dashboard-server-only
```
Result: all passed.

### Web typecheck
```bash
npm --prefix apps/web run typecheck
```
Result: passed.

### Web production build
```bash
npm --prefix apps/web run build
```
Result: passed.

Observed route mode stayed aligned with Phase 12/13 expectations:

- `/dashboard` dynamic;
- `/healthcheck` dynamic;
- `/memory` dynamic;
- `/mugiwaras` dynamic;
- `/vault` dynamic;
- `/skills` static page with dynamic same-origin BFF route handlers.

### Web dependency audit
```bash
npm run audit:web
```
Result: `found 0 vulnerabilities`.

### Targeted backend smoke
```bash
PYTHONPATH=. python - <<'PY'
from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)
endpoints = ['/health','/api/v1/mugiwaras','/api/v1/memory','/api/v1/vault','/api/v1/healthcheck','/api/v1/dashboard','/api/v1/skills']
for path in endpoints:
    response = client.get(path)
    assert response.status_code == 200, (path, response.status_code, response.text[:200])
    assert response.headers.get('x-content-type-options') == 'nosniff', path
    assert response.headers.get('referrer-policy') == 'no-referrer', path
    assert response.headers.get('x-frame-options') == 'DENY', path
    assert response.headers.get('cache-control') == 'no-store', path
preflight = client.options('/api/v1/skills', headers={'Origin': 'https://evil.example', 'Access-Control-Request-Method': 'GET'})
assert preflight.status_code == 403, preflight.status_code
assert preflight.json()['detail']['code'] == 'cors_not_supported', preflight.text
assert 'access-control-allow-origin' not in {k.lower(): v for k, v in preflight.headers.items()}
validation = client.put('/api/v1/skills/zoro-opencode-operator', json={'content': 123, 'expected_sha256': '/srv/should-not-echo'})
assert validation.status_code in (400, 422), validation.status_code
body = validation.text
assert '/srv/should-not-echo' not in body, body
assert 'expected_sha256' not in body, body
print('backend smoke ok')
PY
```
Result: passed.

Note: an earlier over-broad body scan rejected sanctioned canonical `AGENTS.md` excerpts returned by `/api/v1/mugiwaras`; the final smoke correctly validates response status, perimeter headers, CORS rejection and sanitized error behavior rather than banning all canonical path mentions from approved read models.

### Directed secret/CORS scan
```bash
if git grep -nE '(sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|BEGIN (RSA|OPENSSH|PRIVATE) KEY|TELEGRAM_BOT_TOKEN|API_KEY=|TOKEN=|PASSWORD=|SECRET=)' -- . ':!package-lock.json' ':!apps/web/package-lock.json'; then
  echo 'Potential secret pattern found' >&2
  exit 1
fi
if git grep -nE 'Access-Control-Allow-Origin.*\*|allow_origins=\["\*"\]|CORSMiddleware' -- apps docs openspec; then
  echo 'Potential permissive CORS pattern found' >&2
  exit 1
fi
```
Result: passed.

Note: negative-pattern definitions in `scripts/check-perimeter-policy.mjs` are intentionally excluded from the second scan because they are the guardrail itself, not product code/docs enabling CORS.

### Whitespace/diff hygiene
```bash
git diff --check
```
Result: passed after final documentation/script changes.

## Conclusion
Phase 13.5 block verification passed. Phase 13 can close once Chopper + Franky review the closeout PR.

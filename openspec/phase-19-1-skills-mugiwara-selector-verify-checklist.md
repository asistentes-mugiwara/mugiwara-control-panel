# Phase 19.1 verify checklist — Skills globales + selector Mugiwara

## Backend/API
- [x] `PYTHONPATH=. pytest apps/api/tests/test_skills_api.py apps/api/tests/test_mugiwaras_api.py -q`
- [x] `python -m py_compile apps/api/src/modules/skills/domain.py apps/api/src/modules/skills/service.py apps/api/src/modules/mugiwaras/service.py`
- [x] Smoke API local: `/api/v1/skills` devuelve catálogo dinámico con globales y múltiples Mugiwaras.

## Frontend/BFF
- [x] `npm run verify:skills-server-only`
- [x] `npm --prefix apps/web run typecheck`
- [x] `npm --prefix apps/web run build`

## Browser smoke
- [x] `/skills?mugiwara=franky` muestra selector con Franky pulsado, skills globales y skills de Franky.
- [x] `/skills?mugiwara=chopper` muestra selector con Chopper pulsado y skill activa de Chopper.
- [x] `/mugiwaras` contiene enlaces `Ver Skills` con `?mugiwara=<slug>` para cada Mugiwara.
- [x] Consola browser limpia en `/skills?mugiwara=chopper`.

## Hygiene
- [x] `git diff --check`
- [x] `git status --short --branch`
- [ ] PR con review Chopper + Usopp antes de mergear.

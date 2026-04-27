# Issue #40.6 — Git control page closeout/canon

## Opción elegida
A) `closeout/canon` del bloque 40.1–40.5.

## Motivo
PR #93 / Issue #40.5 ya cerró la última microfase funcional prevista para `/git`: selector controlado repo/commit, canonicalización temprana anti-echo RSC y verify completo con review Chopper + Usopp. Abrir ahora refs/rangos/revspecs, remotes, acciones Git, working-tree diff o líneas de diff en DOM aumentaría superficie sensible por inercia y contradice el estado canónico de seguridad.

El siguiente paso seguro es congelar el bloque como read-only controlado, corregir drift del OpenSpec inicial y dejar explícitas las fronteras futuras.

## Contexto verificado
- `main` limpio y alineado con `origin/main` tras merge de PR #93.
- PR #93 está `MERGED`, merge commit `ab10ba5853bff0109b727831c9ce1f756763fa33`.
- Git control 40.1–40.5 queda cerrado:
  - 40.1 backend registry/status.
  - 40.2 backend commits/branches.
  - 40.3 backend commit detail + safe diff.
  - 40.4 frontend `/git` server-only/read-only.
  - 40.5 selector controlado repo/commit con middleware anti-echo antes de RSC.
- El vault `Project Summary - Mugiwara Control Panel` ya registra PR #93 como hito reciente y recomienda no abrir nueva capacidad sin fase explícita.

## Alcance de esta microfase
- Actualizar OpenSpec inicial de Issue #40 para reflejar estado real 40.1–40.5.
- Declarar 40.6 como cierre documental/canónico, no como feature runtime.
- Añadir checklist de verify de closeout.
- Añadir closeout `.engram` de continuidad técnica.
- No tocar runtime, backend, frontend, dependencias, scripts ni configuración operativa.

## Fuera de alcance obligatorio
- Refs, rangos, revspecs o selector de branches como historial.
- Remotes, `fetch`, `pull`, `push` o comparación contra remoto.
- Acciones Git mutables (`checkout`, `reset`, `commit`, `stash`, `merge`, `rebase`, etc.).
- Working-tree diff o contenido de cambios no commiteados.
- Renderizar líneas de diff en HTML/DOM.
- Inputs libres, forms, búsqueda o filtros sobre Git.

Cualquier punto anterior requiere fase nueva, plan propio y review según perímetro: Franky para operación/runtime, Chopper para seguridad/frontera Git y Usopp si hay UI visible.

## Resultado canónico del bloque
`/git` queda como superficie de consulta read-only:
- frontend server-only dinámico;
- adapter `server-only` con `MUGIWARA_CONTROL_PANEL_API_URL` privado;
- selección por enlaces server-side usando solo `repo_id` y SHA backend-owned;
- canonicalización temprana en `apps/web/src/middleware.ts` para evitar eco de query no aceptada en HTML/RSC intermedio;
- sin líneas de diff en DOM: la UI expone metadata, contadores y estados de redacción/truncado/omisión;
- guardrail `npm run verify:git-server-only` como gate de regresión frontend;
- guardrail `npm run verify:git-control-backend-policy` como gate de frontera backend.

## Verify esperado
Como esta microfase es docs/OpenSpec/.engram-only:
```bash
git diff --check
```

Si se toca runtime/UI en una futura microfase Git:
```bash
npm run verify:git-server-only
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
npm run verify:visual-baseline
git diff --check
# smokes HTML/DOM anti-leakage live/degradados, con no-follow redirects si toca canonicalización
```

Si se toca backend Git en una futura microfase:
```bash
PYTHONPATH=. pytest apps/api/tests/test_git_control_api.py -q
npm run verify:git-control-backend-policy
npm run verify:perimeter-policy
git diff --check
```

## Siguiente paso recomendado
No implementar nueva capacidad Git ahora. Mantener el bloque cerrado y elegir solo una de estas rutas futuras si hay necesidad explícita:
1. follow-up operativo/performance del middleware `/git` con Franky si hay evidencia de coste real;
2. polish UI menor de `/git` con Usopp si duele la experiencia actual;
3. plan nuevo para capacidad Git explícita, empezando por diseño/review antes de tocar código.

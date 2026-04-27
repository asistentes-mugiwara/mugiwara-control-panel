# Issue #40.5 — Selector controlado repo/commit para `/git` (`Repos Git`)

## Decisión de división

40.5 debe ser **una microfase única de frontend server-only** con pasos internos, no varias PRs.

Motivo:
- El backend 40.1–40.3 ya expone repos, commits, branches, detail y safe diff.
- 40.4 ya tiene `/git` server-only/read-only y guardrail `verify:git-server-only`.
- El selector propuesto no requiere endpoints nuevos ni cambios de contrato backend.
- Dividirlo en backend/frontend/closeout añadiría burocracia sin reducir riesgo real si mantenemos validación server-side estricta.

Si durante implementación aparece necesidad de nuevos endpoints, paginación, búsqueda, refs, rangos, remotes, working-tree diff o acciones Git, la microfase debe parar y abrir planificación nueva.

## Objetivo

Permitir `Selección controlada` de repo y commit en `/git` sin abrir superficie Git arbitraria.

La UI debe dejar de depender solo de “primer repo + primer commit” y permitir navegación controlada entre:
- repos ya devueltos por `GET /api/v1/git/repos`;
- commits ya devueltos por `GET /api/v1/git/repos/{repo_id}/commits` para el repo seleccionado.

## Principio de seguridad

El navegador puede enviar query params, pero la página server-side solo los acepta si coinciden con valores ya devueltos por backend en esa misma renderización.

Contrato:
- `repo_id` seleccionado debe existir en `repoIndex.repos`.
- `sha` seleccionado debe existir en `commits.commits` del repo seleccionado.
- Si `repo_id` o `sha` son inválidos, se ignoran y se cae a selección saneada por defecto.
- Nunca llamar a `fetchGitCommitDetail` ni `fetchGitCommitDiff` con un SHA que no esté en la lista de commits del repo seleccionado.
- No aceptar paths, refs, rangos, revspecs, branches arbitrarias, remotes, comandos, URLs ni texto libre.

## Alcance incluido

### Paso A — Contrato de selección server-side
- Extender `/git` para leer `searchParams` de Next.js.
- Validar `repo_id` contra repos backend-owned.
- Tras seleccionar repo, cargar commits y branches de ese repo.
- Validar `sha` contra la lista de commits cargada.
- Mantener fallback saneado para repo sin commits o API degradada.

### Paso B — UI de selección sin client component
- Repo cards como enlaces server-side a `/git?repo_id=<repo_id>`.
- Commits del historial como enlaces server-side a `/git?repo_id=<repo_id>&sha=<sha>`.
- Estado visual claro de repo/commit seleccionado.
- Copy explícito: `Selección controlada`, `Solo repos allowlisteados`, `Solo SHAs listados por backend`.
- No añadir inputs de texto, selects libres, búsqueda, filtros, botones de acción ni client-side fetch.

### Paso C — Guardrail, smokes y canon mínimo
- Endurecer `verify:git-server-only` para fijar:
  - `searchParams` server-side permitido solo con validación contra repos/commits cargados;
  - ausencia de inputs libres (`input`, `textarea`, `form` para Git) en `/git`;
  - ausencia de refs/rangos/revspecs/paths/acciones Git en UI;
  - no render de líneas de diff.
- Smoke HTML/DOM con parámetros válidos e inválidos:
  - `/git?repo_id=<válido>&sha=<válido>` renderiza selección esperada;
  - `/git?repo_id=../../secret&sha=HEAD..main` no ecoa input ni llama a detalle/diff con esos valores;
  - fallback no expone backend URL, env, rutas host, `.env`, tokens, stdout/stderr, stack traces ni errores crudos.
- Actualizar OpenSpec/Engram/docs vivas si cambia el contrato visible.

## Fuera de alcance

- Paginación o “cargar más commits”.
- Búsqueda/filtros por texto.
- Refs, branches como selector de historial, rangos, revspecs o comparación entre commits.
- Working-tree diff.
- Acciones Git mutables o remotas.
- Client components para Git, fetch desde navegador o BFF nuevo.
- Renderizar líneas de diff en HTML/DOM.
- Tooltips/copy buttons/interacciones nuevas sobre SHA.

## Definition of Done

- `/git` permite seleccionar repo y commit mediante enlaces controlados.
- La selección solo usa `repo_id` y SHA ya devueltos por backend.
- Query params inválidos se ignoran sin eco ni error crudo.
- No hay inputs libres ni selectors arbitrarios.
- No se renderizan líneas de diff en HTML/DOM.
- Server-only/read-only y fallback saneado siguen intactos.
- Usopp valida UX/responsive del selector.
- Chopper valida no-leakage y frontera Git.

## Verify esperado

```bash
npm run verify:git-server-only
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
npm run verify:visual-baseline
git diff --check
# smoke HTML/DOM anti-leakage con API válida e inválida
# browser smoke /git con repo/commit válido e inválido
```

## Review routing

- **Usopp**: UI/UX, jerarquía, responsive, claridad del selector y estados seleccionados.
- **Chopper**: server-only/no-leakage, validación de query params, ausencia de refs/revspecs/paths/acciones Git y no render de diff lines.
- **Franky**: no necesario salvo que aparezca backend/runtime/cache/polling/endpoints nuevos.

## Riesgos

- Query params son controlables por el usuario: mitigación obligatoria con validación server-side contra datos backend ya cargados.
- `sha` completo sigue siendo dato Git sensible moderado pero ya backend-owned y aceptado en 40.4; no añadir truncado funcional ni copiar acciones.
- Si el usuario espera paginación, no incluirla en 40.5: debe quedar para una fase posterior solo si 12 commits no bastan en uso real.

## Siguiente paso

Implementar 40.5 como una única PR pequeña: selector server-side repo/commit, guardrail reforzado y smokes anti-leakage. Después, si pasa review Usopp + Chopper, cerrar Issue #40 con una fase de cierre/canon ligera o comentario final si no hace falta más código.

# Issue #40 — Git control page planning

## Estado
- Issue: [#40 Add Git control page for local repository history and diffs](https://github.com/asistentes-mugiwara/mugiwara-control-panel/issues/40)
- Planificación: PR #88 cerrada.
- Microfase 40.1: PR #89 mergeada; backend-only registry/status implementado.
- Microfase 40.2: PR #90 mergeada; backend-only commits/branches read model implementado.
- Microfase 40.3: PR #91 mergeada; backend commit detail + safe diff implementado.
- Microfase 40.4: PR #92 mergeada; frontend `/git` server-only/read-only implementado.
- Microfase 40.5: PR #93 mergeada; selector controlado repo/commit y canonicalización temprana anti-echo RSC implementados.
- Microfase 40.6: closeout/canon preparado en `openspec/issue-40-6-closeout-canon.md`.
- Tipo de fase: planificación SDD inicial + microfases backend/frontend runtime + closeout/canon.
- Fecha: 2026-04-27

## Objetivo
Diseñar el corte seguro para añadir una página de control Git local que permita consultar repositorios allowlisteados, historial, ramas/refs, estado y diffs desde el control panel privado sin convertir el backend en explorador del filesystem ni en consola Git destructiva.

## Contexto revisado
- `AGENTS.md`: el backend es frontera de seguridad, deny-by-default, allowlists explícitas, sin acceso arbitrario al filesystem; `skills` sigue siendo la única escritura prevista del MVP.
- Issue #40: pide índice de repos locales, historial, detalle de commit, diffs, working tree read-only y extracción de trailers `Mugiwara-Agent`/`Signed-off-by`.
- `docs/api-modules.md`: módulos existentes `skills`, `mugiwaras`, `memory`, `vault`, `healthcheck`, `dashboard`, `usage`, `system`; las fuentes host-adjacent previas se diseñaron como endpoints fijos, inputs mínimos y outputs saneados.
- `docs/read-models.md`: todos los recursos usan envelope `resource/status/data/meta`, no exponen blobs arbitrarios, secretos ni paths host; errores se traducen a estados explícitos.
- `docs/runtime-config.md`: frontend debe consumir backend mediante `MUGIWARA_CONTROL_PANEL_API_URL` solo desde servidor; nada de `NEXT_PUBLIC_*` para backend interno.
- `docs/frontend-ui-spec.md`: navegación actual `Dashboard`, `Mugiwaras`, `Skills`, `Memory`, `Vault`, `Healthcheck`, `Uso`; nuevas páginas deben mantener shell operativo, read-only claro y responsive sin overflow.
- Código actual: FastAPI registra routers en `apps/api/src/main.py`; módulos backend son cohesivos; frontend usa server-only adapters para páginas API-backed y `SidebarNav` centraliza navegación.
- Guardrails existentes: hay checks específicos por superficie (`verify:*server-only`, `verify:perimeter-policy`, `verify:healthcheck-source-policy`, `verify:system-metrics-*`), pero todavía no existe guardrail Git.
- OpenCode/SDD: se intentó arrancar `sdd-orchestrator-zoro`; quedó en `sdd-init` y agotó timeout externo de 300s, por lo que esta planificación se cierra como recuperación SDD inline/manual.

## Principios de diseño
1. **Read-only estricto en el MVP Git.** Sin checkout, reset, commit, push, pull, fetch, stash, merge, rebase, tag creation ni escritura de refs.
2. **Repositorio por ID allowlisteado.** El cliente nunca envía paths. Los endpoints reciben `repo_id` estable que se resuelve en backend contra una registry explícita.
3. **Sin discovery arbitrario.** Puede haber discovery offline/revisado para construir allowlist, pero el backend de petición no debe recorrer raíces operativas del host ni resolver glob dinámico desde input cliente.
4. **Git como fuente host-adjacent sensible.** Cualquier lectura de Git debe tener timeout, cwd fijo, argumentos allowlisteados, entorno mínimo y `shell=False` si se usa subprocess.
5. **Deny-by-default para diffs.** Los diffs son potencialmente secretos aunque estén commiteados. Paths sensibles se omiten; contenido sospechoso se redacta; límites de tamaño/líneas siempre visibles.
6. **No exponer topología innecesaria.** Mostrar nombre lógico y, si procede, enlace GitHub saneado; no serializar rutas absolutas, remotes internos, filesystem real, stdout/stderr ni errores crudos.
7. **Estados degradados explícitos.** Repos no configurados/ilegibles/corruptos deben degradar a `not_configured`/`unknown`/`stale` o equivalente, nunca a sano silencioso.
8. **Agent-first.** Trailers `Mugiwara-Agent` y `Signed-off-by` se modelan como campos explícitos para auditoría multiagente.
9. **Frontend sin seguridad propia.** La UI no decide qué repo o diff es seguro; solo representa contratos backend ya saneados.

## Fuera de alcance inicial
- Acciones Git de escritura o remotas (`commit`, `push`, `pull`, `fetch`, `checkout`, `reset`, `stash`, `merge`, `rebase`).
- Editor de archivos, aplicación de patches o revert desde UI.
- Búsqueda global persistente/indexación compleja.
- Diff completo de archivos sensibles, binarios o enormes.
- Navegador genérico de filesystem o selección dinámica de repos desde cliente.
- Exposición pública fuera del perímetro privado/Tailscale sin auth/session/rate-limit.

## Modelo backend propuesto

### Módulo nuevo
Crear `apps/api/src/modules/git_control/` con capas pequeñas:
- `domain.py`: tipos internos, IDs allowlisteados, políticas de truncado/redacción.
- `registry.py`: repos permitidos backend-owned.
- `service.py`: casos de uso read-only.
- `git_adapter.py`: única frontera que invoca Git o librería Git, con timeout y errores saneados.
- `router.py`: endpoints `GET /api/v1/git/...`.
- `AGENTS.md`: reglas específicas del módulo.

### Registry inicial
IDs lógicos recomendados:
- `crew-core` -> repo operativo configurado en backend mediante ruta privada de runtime.
- `mugiwara-control-panel` -> repo de este proyecto configurado en backend mediante ruta privada de runtime.
- `vault` -> repo/carpeta canónica configurada en backend solo si se acepta explícitamente como superficie de lectura.
- Otros proyectos solo si se añaden explícitamente a la registry backend-owned.

La registry puede contener rutas absolutas internamente, pero esas rutas no deben aparecer en payloads, UI, logs públicos, errores crudos ni documentación pública. El payload público debe usar `repo_id`, `label`, `scope` y estado, no ruta absoluta. Si hay remote GitHub público, exponer solo URL HTTP saneada o `null`; no serializar remotes privados ni SSH interno.

### Endpoints por microfase
- `GET /api/v1/git/repos`
  - Lista repos allowlisteados con rama actual, último commit resumido, estado clean/dirty, ahead/behind saneado si está disponible sin red, y `source_state`.
- `GET /api/v1/git/repos/{repo_id}/commits?limit=&cursor=`
  - Historial paginado con límite máximo bajo, hashes, autor/email opcionalmente saneado, fechas, asunto y trailers; el cuerpo libre del commit se usa solo internamente para extraer trailers y no se publica.
- `GET /api/v1/git/repos/{repo_id}/branches`
  - Ramas/refs locales allowlisted y rama actual; sin resolver refs arbitrarias desde cliente.
- `GET /api/v1/git/repos/{repo_id}/commits/{sha}`
  - Detalle de commit con metadata, trailers y lista de archivos tocados con stats; SHA completo hex validado, sin refs/rangos/revspecs.
- `GET /api/v1/git/repos/{repo_id}/commits/{sha}/diff`
  - Diff unificado seguro, truncado por archivo y total, con paths sensibles y binarios omitidos, y líneas permitidas redactadas si contienen tokens/rutas host.
- `GET /api/v1/git/repos/{repo_id}/status`
  - Working tree read-only. Primero summary/status; diff del working tree solo tras cerrar política de redacción equivalente a commit diff.

### Validación de inputs
- `repo_id`: enum/allowlist exacta.
- `sha`: hex SHA-1/SHA-256 abreviado/completo con resolución segura mediante Git sobre repo fijo; rechazar `..`, `:`, `/`, espacios, flags y revspecs complejas.
- `limit`: entero con máximo fijo, p. ej. 25/50.
- `cursor`: token opaco producido por backend o SHA validado estrechamente; no aceptar revsets arbitrarios.

### Política de diff y redacción
Bloquear/omitir por path:
- `.env`, `.env.*` salvo `.env.example`.
- claves, certificados, tokens, cookies, credenciales.
- dumps, backups, logs sensibles.
- bases de datos locales (`*.db`, `*.sqlite`, `*.sqlite3`).
- artefactos binarios o demasiado grandes.

Bloquear/redactar por contenido:
- tokens/keys/cookies/Authorization.
- valores con forma de secreto (`-----BEGIN ... PRIVATE KEY-----`, `ghp_`, `sk-`, `xox`, etc.).
- rutas absolutas host innecesarias si aparecen dentro del diff.

El API debe indicar `omitted_reason`, `truncated`, `redacted` y contadores; no debe devolver el contenido sensible ni el patrón exacto detectado si eso revela material.

## Modelo frontend propuesto
- Ruta `/git` o `/git-control`; recomendación: `/git` con label visible `Git` o `Repos Git`.
- Página server-side dinámica con adapter `apps/web/src/modules/git/api/git-http.ts` que importa `server-only`, usa `MUGIWARA_CONTROL_PANEL_API_URL`, endpoint fijo y fallback saneado.
- Componentes:
  - índice de repos con estado clean/dirty/stale/unknown;
  - historial por repo;
  - detalle de commit/diff como panel secundario o ruta futura;
  - avisos claros de `Solo lectura`, `Diff truncado`, `Archivo omitido por seguridad`.
- No fetch browser directo al backend interno; no `NEXT_PUBLIC_*`; no renderizar backend URL, rutas absolutas, stderr/stdout, stack traces ni errores crudos.
- Responsive: evitar tablas anchas como requisito inicial; preferir cards/listas con bloques `pre` que hagan wrap/scroll interno controlado solo en el diff.

## Microfases recomendadas

### 40.1 — Backend registry + repo/status foundation
**Estado:** implementado en rama `zoro/issue-40-1-git-registry-status`.

**Objetivo:** crear módulo Git read-only con registry backend-owned y endpoint `GET /api/v1/git/repos` + `status` resumido, sin diffs.

**Incluye:** allowlist de repos, validación de repo IDs, adaptación Git read-only con timeout/errores saneados, branch actual saneada y estado dirty resumido con conteos. No calcula ahead/behind todavía para evitar semántica remota/local antes de cerrar la siguiente microfase.

**No incluye:** commit detail, diff content, frontend visible salvo docs/contracts.

**TDD/verify:** tests backend para allowlist, repo desconocido, ausencia/corrupción degradada, no path leakage, no stdout/stderr, query maliciosa ignorada/rechazada; `py_compile`; `PYTHONPATH=. pytest apps/api/tests/test_git_control_api.py -q`; `npm run verify:git-control-backend-policy`; `npm run verify:perimeter-policy`; `git diff --check`.

**Review:** Franky + Chopper.

### 40.2 — Backend commits + branches read model
**Estado:** implementado en rama `zoro/issue-40-2-git-commits-branches`.

**Objetivo:** listar commits recientes, trailers y ramas locales seguras.

**Incluye:** `GET /api/v1/git/repos/{repo_id}/commits?limit=&cursor=`, `GET /api/v1/git/repos/{repo_id}/branches`, parsing de trailers `Mugiwara-Agent`/`Signed-off-by`, límites de paginación `1..50`, cursor opaco `offset:<n>`, validación estricta de cursor y ausencia de refs/SHA/revspecs cliente. Git mantiene hardening de 40.1 y añade solo subcomandos read-only `log` y `branch`.

**No incluye:** diff content, commit detail por SHA, refs/remotes, working tree diff ni UI.

**TDD/verify:** fixtures de repos temporales con trailers, mensajes multilinea, autores, ramas; rechazo de revspecs maliciosas vía cursor; no leakage de paths/remotes; guardrail actualizado.

**Review:** Franky + Chopper.

### 40.3 — Backend commit detail + safe diff
**Estado:** implementado en rama `zoro/issue-40-3-commit-detail-safe-diff`.

**Objetivo:** exponer detalle de commit y diff seguro/truncado.

**Incluye:** `GET /api/v1/git/repos/{repo_id}/commits/{sha}` y `GET /api/v1/git/repos/{repo_id}/commits/{sha}/diff`, stats por archivo, binary detection, límites por archivo/total, omisión por path sensible, redacción por contenido y `truncated/redacted/omitted_reason` explícitos. El SHA aceptado es completo hex SHA-1/SHA-256 devuelto por backend, no refs ni revspecs.

**No incluye:** working tree diff, UI completa, refs/rangos arbitrarios ni cuerpo libre de commits.

**TDD/verify:** tests con `.env`, DB/binario, diff grande, contenido con token sintético, SHA inválido/revspec malicioso y scan recursivo del payload público; `py_compile`; `PYTHONPATH=. pytest apps/api/tests/test_git_control_api.py -q`; `npm run verify:git-control-backend-policy`; `npm run verify:perimeter-policy`; `git diff --check`.

**Review:** Franky + Chopper obligatorio.

### 40.4 — Frontend `/git` read-only page
**Estado:** implementado en PR #92.

**Objetivo:** añadir página UI que consuma los endpoints backend cerrados para índice, historial y detalle/diff de commits.

**Incluye:** navegación `Repos Git`, server-only adapter, página dinámica, estados de fuente/fallback, cards/listas responsive, copy de solo lectura y avisos de redacción/truncado/omisión. Tras review de Chopper, el frontend no renderiza líneas de diff en HTML/DOM; muestra metadata, contadores y estados.

**No incluye:** acciones Git, working-tree diff, búsqueda avanzada, refs/rangos/revspecs ni líneas de diff en DOM.

**TDD/verify:** `verify:git-server-only`, typecheck/build, visual baseline, smoke HTML/DOM anti leakage (`MUGIWARA_CONTROL_PANEL_API_URL`, backend URL, rutas host, `.env`, tokens sintéticos, stdout/stderr, stack traces), browser smoke responsive.

**Review:** Usopp + Chopper.

### 40.5 — Frontend selector controlado repo/commit
**Estado:** implementado en PR #93.

**Objetivo:** permitir selección controlada de repo y commit en `/git` sin abrir input Git arbitrario.

**Incluye:** repo cards y commits como enlaces server-side; `repo_id` aceptado solo si existe en `repoIndex.repos`; `sha` aceptado solo si existe en `commits.commits` del repo seleccionado; canonicalización temprana en `apps/web/src/middleware.ts` para redirigir queries no soportadas, duplicadas, inseguras o no validables antes de render RSC.

**No incluye:** paginación avanzada, búsqueda/filtros, refs/rangos/revspecs, remotes, acciones Git, working-tree diff, inputs libres ni líneas de diff en DOM.

**TDD/verify:** `verify:git-server-only`, typecheck/build, visual baseline, `git diff --check`, smokes HTML/DOM anti-leakage live/degradados con redirects follow y no-follow.

**Review:** Usopp + Chopper. Chopper aprobó tras fix de middleware anti-echo RSC; Usopp dejó `mergeable_with_minor_followups`.

### 40.6 — Closeout/canon
**Estado:** preparado en `openspec/issue-40-6-closeout-canon.md`.

**Objetivo:** actualizar OpenSpec, `.engram` y canon vivo tras cerrar 40.1–40.5, dejando congelado el bloque read-only y documentando que cualquier nueva capacidad Git requiere fase explícita.

**Verify:** docs-only `git diff --check`. Si una futura fase toca runtime/UI, volver a ejecutar `verify:git-server-only`, typecheck, build, visual baseline y smokes anti-leakage; si toca backend Git, ejecutar tests backend Git, `verify:git-control-backend-policy` y `verify:perimeter-policy`.

## Guardrails nuevos propuestos
- `npm run verify:git-control-backend-policy`
  - Exige módulo `git_control` con registry allowlisted.
  - Bloquea `shell=True`, comandos destructivos (`commit`, `push`, `pull`, `fetch`, `checkout`, `reset`, `stash`, `merge`, `rebase`, `tag` salvo lectura explícita si se diseña), filesystem discovery genérico y endpoints con path/url controlado por cliente.
  - Exige timeout, `shell=False` si hay subprocess, `--no-ext-diff`, límites de diff y política de redacción/omisión.
- `npm run verify:git-server-only`
  - Exige adapter frontend `server-only`, env privada, endpoint fijo, página dinámica, ausencia de `NEXT_PUBLIC_*`, sin fetch browser directo, sin backend URL/rutas host/errores crudos renderizados.

## Documentación a actualizar al implementar
- `docs/api-modules.md`: añadir módulo `git_control` y endpoints.
- `docs/read-models.md`: añadir recursos `git.repo_index`, `git.commit_list`, `git.commit_detail`, `git.diff`, `git.status`.
- `docs/runtime-config.md`: añadir patrón server-only para `/git` y guardrail.
- `docs/frontend-ui-spec.md`: añadir navegación `Git` y wireframe de página read-only.
- `docs/frontend-implementation-handoff.md`: estructura recomendada de módulos frontend Git.
- `AGENTS.md` de `apps/api/src/modules`, `apps/web/src/modules` si nace nueva carpeta.

## Riesgos abiertos
- **Nueva capacidad Git por inercia:** refs/rangos/revspecs, remotes, acciones Git, working-tree diff y líneas de diff en DOM quedan fuera del bloque cerrado y requieren planificación/review propios.
- **Diffs históricos con secretos:** mitigado por safe diff backend y por no renderizar líneas de diff en frontend; cualquier cambio que vuelva a exponer contenido debe pasar por Chopper.
- **Working tree no commiteado:** riesgo mayor que commit history por secretos no commiteados; no está implementado y no debe añadirse sin fase nueva.
- **Subprocess Git:** aceptable solo en el backend ya revisado, con arg list, cwd fijo, timeout, entorno mínimo, `shell=False` y comandos read-only allowlisteados.
- **Remote/ahead-behind:** no ejecutar red en request. Comparar solo refs locales; cualquier `fetch` pertenece a productor/operación separada, no al endpoint.
- **Rutas absolutas:** útiles internamente para backend, no para UI/API pública del control plane; usar labels lógicos.
- **Coste de middleware `/git`:** el fetch temprano para canonicalización anti-echo puede merecer medición operativa si hay carga real; tratar como follow-up Franky, no como feature Git.

## Siguiente paso recomendado
Cerrar el bloque con 40.6 y no implementar nueva capacidad Git ahora.

Opciones futuras seguras solo si hay necesidad explícita:
1. follow-up operativo/performance del middleware `/git` con Franky;
2. polish UI menor de `/git` con Usopp;
3. plan nuevo para capacidad Git concreta con revisión Franky/Chopper/Usopp según perímetro.

No abrir refs/rangos/revspecs, remotes, acciones Git, working-tree diff ni líneas de diff en DOM sin diseño y review nuevos.
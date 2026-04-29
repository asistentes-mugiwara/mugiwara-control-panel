# Issue 121 — Vault explorer + Markdown reader plan

## Objetivo
Rediseñar `/vault` como una herramienta operativa de dos columnas: explorador de archivos del vault a la izquierda y lector Markdown renderizado a la derecha.

La página actual basada en cards editoriales, índice allowlisted visual, paneles de metadata externos y extractos procesados queda sustituida. La nueva superficie debe ser simple, rápida, privada, read-only y usable como lector de canon.

## Por qué ahora
Tras cerrar la marca visual del panel y dejar el control panel operativo privado, el único issue abierto pide simplificar `/vault` de forma clara. El estado actual del repo muestra que `/vault` ya es server-only en frontend y el backend ya tiene una frontera read-only, pero todavía está limitado a tres documentos allowlisted y serializa un view model editorializado (`sections`, `meta`, `toc`, `canon_callout`) que no encaja con el nuevo objetivo.

## Estado real inspeccionado
- Issue GitHub: #121 abierto con decisión de producto cerrada.
- Frontend actual:
  - `apps/web/src/app/vault/page.tsx` es server page dinámica (`force-dynamic`).
  - `apps/web/src/modules/vault/api/vault-http.ts` usa `import 'server-only'`, env privada `MUGIWARA_CONTROL_PANEL_API_URL`, `cache: 'no-store'`.
  - `apps/web/src/app/vault/VaultClient.tsx` es client component y contiene la experiencia actual a retirar.
- Backend actual:
  - `apps/api/src/modules/vault/service.py` usa root fijo `/srv/crew-core/vault`, pero la navegación/documentos son allowlist estática de tres documentos.
  - `GET /api/v1/vault` devuelve workspace editorializado con `tree`, `documents`, `freshness`.
  - `GET /api/v1/vault/documents/{document_path:path}` exige path en allowlist y devuelve `VaultDocument` parseado en secciones.
  - tests existentes cubren no host path leakage, traversal, extensión, symlink y saneado básico.
- Guardrail actual:
  - `npm run verify:vault-server-only` falla en `main` antes de este plan porque busca el literal histórico `Estado de API` ya sustituido por `Estado de fuente`. La implementación debe arreglarlo al tocar Vault.

## Principios operativos
1. Backend sigue siendo la frontera de seguridad. El navegador nunca lee filesystem ni recibe rutas absolutas.
2. Lectura read-only estricta: nada de crear, editar, borrar, renombrar, mover ni escribir en vault.
3. Root único backend-owned: `/srv/crew-core/vault`.
4. Cliente solo puede seleccionar rutas relativas saneadas emitidas por backend o validadas contra el árbol backend-owned.
5. No mostrar rutas absolutas host, `.git`, `.obsidian`, `.env`, ficheros ocultos, symlinks, binarios, dumps ni contenido oversized.
6. Preferir núcleo excelente —árbol navegable + lector Markdown— antes que features secundarias.
7. Mantener fallback visible y saneado si la API no está configurada o falla.

## Fuera de alcance
- Escritura de vault.
- Edición Markdown.
- Creación/borrado/renombrado/movimiento de documentos.
- Búsqueda full-text global.
- TOC lateral obligatorio o panel derecho de metadata.
- Exposición pública/internet del panel.
- Cambios runtime/deploy/systemd.

## Roadmap de microfases

### 121.1 — Backend explorer contract y tree dinámico seguro
**Objetivo:** sustituir la allowlist editorial de tres documentos por un contrato backend-owned de explorador read-only.

**Alcance:**
- Definir read models de `VaultExplorerTree`, `VaultExplorerNode` y `VaultDocumentRef` o equivalente.
- Recorrer `/srv/crew-core/vault` de forma controlada y determinista.
- Incluir carpetas y `.md` permitidos con rutas relativas.
- Excluir hidden dirs/files (`.git`, `.obsidian`, `.env`, dotfiles), symlinks, no-markdown, binarios y rutas fuera de root.
- Añadir límites: profundidad, número de nodos y tamaño máximo de documento referenciado.
- Endpoint recomendado: mantener `GET /api/v1/vault` como workspace del explorador o añadir `GET /api/v1/vault/tree` si mejora claridad, sin romper innecesariamente frontend.
- No devolver contenido Markdown todavía salvo referencias y metadata mínima segura.

**DoD:**
- Tests backend para árbol real sintético con carpetas, markdown, hidden, symlink, no-md, traversal y límites.
- Payload sin `/srv/`, `/home/`, `.env`, `.git`, `.obsidian`, stdout/stderr/logs ni rutas absolutas.
- Meta explicita `read_only=true`, `safe_root=canonical_vault`, `sanitized=true`.

**Verify:**
- `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q`
- `python3 -m py_compile apps/api/src/modules/vault/*.py apps/api/tests/test_vault_api.py`
- `git diff --check`

**Review:** Chopper obligatorio. Franky solo si se añade config/runtime nueva o cambios operativos.

### 121.2 — Backend document reader raw Markdown saneado
**Objetivo:** entregar el contenido Markdown completo permitido para render en frontend, sin editorializar en secciones ni duplicar metadata externa.

**Alcance:**
- `GET /api/v1/vault/documents/{relative_path:path}` acepta solo path relativo `.md` validado contra root y políticas del árbol.
- Rechaza rutas absolutas, `~`, traversal, symlinks, hidden, no-md, oversized y ficheros fuera de root.
- Devuelve contenido Markdown como texto (`markdown` o `content`) más metadata mínima segura: `relative_path`, `name`, `updated_at`, `size_bytes` si no revela internals, `read_only`.
- Preserva frontmatter dentro del Markdown para que se lea como parte del documento, no en panel externo.
- Errores saneados: códigos estables sin path host ni excepción cruda.

**DoD:**
- Tests de documento permitido, frontmatter preservado, tablas/listas/código en contenido, oversized, symlink, hidden, no-md, traversal encoded y no-leakage recursivo.
- Sin parsing editorial que elimine headings/listas/tablas/código del documento.

**Verify:**
- `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q`
- `python3 -m py_compile apps/api/src/modules/vault/*.py apps/api/tests/test_vault_api.py`
- `git diff --check`

**Review:** Chopper obligatorio.

### 121.3 — Frontend two-column explorer + Markdown reader
**Objetivo:** reemplazar completamente la UI actual de `/vault` por el layout pedido: explorador izquierdo y lector Markdown derecho.

**Alcance:**
- Retirar cards/textos actuales de `VaultClient` (`Canon curado`, `Índice allowlisted`, panel de metadata externo, TOC lateral, callouts editoriales actuales).
- Crear UI tipo VS Code/Obsidian: árbol colapsable, documento activo resaltado, scroll independiente.
- Lector Markdown renderizado con headings, listas, tablas, enlaces, blockquotes y código.
- Estado vacío inicial si no hay selección o seleccionar primer documento seguro si el contrato lo define explícitamente.
- Fallback local saneado compatible si API no configurada.
- Mantener `PageHeader` mínimo: `Vault · Solo lectura` y pills reducidas.
- No usar `dangerouslySetInnerHTML` salvo sanitizer explícito revisado; preferir renderer Markdown controlado/conservador o parser propio limitado.

**DoD:**
- `/vault` ya no muestra la experiencia anterior ni sus textos/paneles.
- Desktop: dos columnas, explorer + reader.
- Lector con ancho cómodo y buen wrapping de tablas/código.
- Sin backend URL/env/rutas host/errores crudos en HTML/DOM.

**Verify:**
- `npm run verify:vault-server-only` — actualizado para el nuevo contrato y pasando.
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:visual-baseline`
- Smoke browser `/vault`: consola limpia, documento seleccionado visible, markdown renderizado, sin overflow horizontal.
- Smoke HTML no-leakage con API válida y API no configurada.
- `git diff --check`

**Review:** Usopp + Chopper obligatorios.

### 121.4 — Responsive, guardrail, docs y closeout
**Objetivo:** cerrar el bloque de rediseño con responsive robusto, guardrails actualizados, documentación viva y canon.

**Alcance:**
- Responsive tablet/mobile: explorer como panel apilado/drawer o selector plegable; lectura prioritaria.
- Guardrail `verify:vault-server-only` actualizado para el nuevo contrato: server-only adapter, env privada, no `NEXT_PUBLIC_*`, página dinámica, sin filesystem browser, no proxy genérico, no rutas absolutas, estados fallback visibles y textos viejos retirados.
- Actualizar docs según cambio real: `docs/frontend-ui-spec.md`, `docs/frontend-implementation-handoff.md`, `docs/observability-surface.md`, `docs/backend-boundary.md`, `docs/runtime-config.md`, y si aplica `docs/api-modules.md` / `docs/read-models.md`.
- Actualizar Project Summary del vault al cerrar #121.
- Comentar y cerrar issue #121 tras merge final.

**DoD:**
- Browser smoke desktop/tablet/mobile sin overflow horizontal.
- Docs alineadas con la nueva semántica de Vault.
- PR final deja claro qué quedó fuera: edición, búsqueda full-text, TOC lateral y acciones de filesystem.

**Verify:**
- `npm run verify:vault-server-only`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:visual-baseline`
- `PYTHONPATH=. pytest apps/api/tests/test_vault_api.py -q`
- `git diff --check`
- Smoke Tailscale post-merge si hubo cambio visible final.

**Review:** Usopp + Chopper obligatorios. Franky solo si aparece cambio runtime/deploy/config operativa.

## Orden recomendado
1. Implementar 121.1 antes de cualquier UI real para fijar el contrato seguro del árbol.
2. Implementar 121.2 para document reader raw Markdown y cerrar seguridad de rutas/contenido.
3. Implementar 121.3 con la nueva experiencia visual completa, usando el contrato ya seguro.
4. Implementar 121.4 como hardening/canon/closeout para evitar drift de docs y guardrails.

## Riesgos
- **Riesgo de filesystem traversal/leakage:** mitigado separando backend primero y validando rutas antes de UI.
- **Riesgo de exponer secretos en Markdown real:** mitigado por exclusión de hidden/oversized, root fijo y no-leakage; aun así el vault canónico puede contener texto sensible si se escribe allí. Mantener política de vault saneado.
- **Riesgo de XSS Markdown:** no renderizar HTML crudo; sanitizer o renderer conservador.
- **Riesgo de sobredimensionar la fase:** no añadir búsqueda full-text, edición ni paneles laterales.
- **Riesgo de guardrail viejo roto:** `verify:vault-server-only` ya falla en main por literal histórico; arreglarlo en la primera microfase que toque Vault web/guardrail.

## Política de rama y cierre
- Planificación: `zoro/issue-121-vault-redesign-plan`.
- Implementación: una rama por microfase, por ejemplo `zoro/issue-121-1-vault-tree`, `zoro/issue-121-2-vault-document-reader`, `zoro/issue-121-3-vault-frontend`, `zoro/issue-121-4-vault-closeout`.
- Cada microfase debe cerrar con commit/PR propio y reviews según perímetro.
- No cerrar #121 hasta terminar la microfase 121.4 y desplegar el cambio visible.

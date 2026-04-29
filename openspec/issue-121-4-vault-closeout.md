# Issue #121.4 — Vault responsive, guardrails, docs y closeout

## Objetivo
Cerrar el bloque #121 después de PR #125 dejando `/vault` estable como explorador de archivos + lector Markdown, con responsive móvil/tablet endurecido, guardrail `verify:vault-server-only` alineado al contrato nuevo, documentación viva y canon actualizados.

## Contexto
- #121.1 cerró el contrato backend de árbol seguro.
- #121.2 cerró el reader raw Markdown backend.
- #121.3 / PR #125 sustituyó la UI legacy por explorer + reader y fue aprobada por Usopp + Chopper.
- 121.4 no abre capacidades nuevas: no escritura, no búsqueda full-text, no editor, no endpoints nuevos.

## Alcance
- Endurecer layout responsive de `/vault`:
  - tablet: una columna completa para explorer + reader, sin huecos intermedios.
  - móvil: priorizar lectura colocando el lector antes que el explorador.
  - explorador con altura acotada y scroll propio.
  - indentación capada para árboles profundos.
  - tablas/código/frontmatter sin overflow horizontal de página.
- Actualizar `verify:vault-server-only` para fijar el contrato 121.4.
- Actualizar docs vivas relevantes.
- Actualizar Project Summary/canon del vault si el cierre cambia el estado canónico.
- Ejecutar verify real y smoke Tailscale post-merge.
- Comentar y cerrar #121 si todo queda cerrado.

## Fuera de alcance
- Escritura/edición del vault.
- Crear/borrar/renombrar documentos.
- Búsqueda full-text.
- Nuevo backend, auth, runtime config o dependencias Markdown.
- Tercer panel, TOC lateral obligatorio o ficha externa de metadata.

## Cambios aplicados
- `VaultClient` limita la indentación visual del árbol con `clamp(...)`.
- CSS de `/vault` apila antes en tablet (`max-width: 1100px`) y elimina el layout intermedio que dejaba el lector en fila completa con hueco lateral.
- En móvil (`max-width: 640px`) el lector tiene `order: 1` y el explorador `order: 2`, con explorer a `max-height: 30vh`.
- Markdown tables pasan a `min-width: min(520px, 100%)` y celdas con `overflow-wrap:anywhere`.
- Metadata, code/frontmatter y tree rows quedan con min-width/wrap/padding más seguros.
- `scripts/check-vault-server-only.mjs` ahora comprueba path assertion, responsive 121.4 e invariantes de overflow.
- Docs vivas actualizadas: `frontend-ui-spec`, `frontend-implementation-handoff`, `observability-surface`, `runtime-config`.

## Definition of done
- [x] Responsive móvil/tablet endurecido sin ampliar producto.
- [x] Guardrail `verify:vault-server-only` actualizado.
- [x] Docs vivas actualizadas.
- [x] Verify local real ejecutado.
- [x] PR con Usopp + Chopper si el diff UI/seguridad lo requiere.
- [ ] PR mergeada a `main`.
- [ ] Servicios persistentes reiniciados si hay cambio visible.
- [ ] Smoke Tailscale de `/vault` post-merge.
- [ ] Project Summary del vault actualizado/pusheado.
- [ ] #121 comentada y cerrada.

## Review routing
- Usopp: obligatorio por responsive móvil/tablet visible.
- Chopper: obligatorio porque se endurece `verify:vault-server-only`, no-leakage y reader Markdown.
- Franky: no requerido salvo que aparezcan cambios de runtime/deploy/config operativa; esta microfase no los toca.

## Riesgos
- Browser smoke local puede no redimensionar todos los viewports; se compensa con checks DOM de overflow y CSS guardrail, pero se debe documentar cualquier límite.
- Smoke Tailscale debe hacerse después de merge + build + restart de web/API si procede, para no validar un build viejo.

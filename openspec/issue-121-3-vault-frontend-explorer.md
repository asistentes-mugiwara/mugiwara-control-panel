# Issue 121.3 — Vault frontend explorer + Markdown reader

## Objetivo

Sustituir la experiencia editorial legacy de `/vault` por un explorador de archivos + lector Markdown de solo lectura, consumiendo exclusivamente:

- `GET /api/v1/vault/tree`
- `GET /api/v1/vault/documents/{document_path:path}`

## Alcance implementado

- Página server-side dinámica `apps/web/src/app/vault/page.tsx`.
- Adapter server-only `apps/web/src/modules/vault/api/vault-http.ts` con env privada `MUGIWARA_CONTROL_PANEL_API_URL`, `cache: no-store` y path encoding por segmento.
- UI cliente sin acceso a backend URL ni env server:
  - panel izquierdo de explorador con carpetas colapsables, indentación, activo resaltado y scroll independiente;
  - panel derecho de lector Markdown;
  - fallback local saneado cuando API no está configurada o falla.
- Render Markdown conservador sin `dangerouslySetInnerHTML`:
  - frontmatter como bloque de código visible;
  - headings, listas, blockquotes, tablas, enlaces y fenced code;
  - enlaces sanitizados a `http:`, `https:`, rutas internas `/...` o anchors `#...`.
- Retirada de textos/paneles legacy: `Canon curado`, `Índice allowlisted`, ficha externa de metadatos y TOC lateral obligatorio.

## Fuera de alcance

- Escritura/edición/renombrado/borrado de Vault.
- Búsqueda global.
- Fetch client-side directo al backend.
- Nueva dependencia Markdown externa.
- Cierre/canon final de #121 completo, reservado para 121.4.

## Riesgos y mitigaciones

- **Markdown/XSS:** mitigado renderizando React nodes/texto escapado, sin HTML raw ni `dangerouslySetInnerHTML`, y links saneados.
- **Path traversal/UI echo:** mitigado aceptando solo paths presentes en `tree.documents` backend-owned antes de pedir documento.
- **Fugas de backend/env:** mitigado con adapter `server-only`, env privada y guardrail `verify:vault-server-only`.
- **Responsive fino:** base apilable ya queda cubierta por CSS global; hardening completo sigue en 121.4.

## Review requerida

- Usopp: UI/UX, claridad del explorer, lector, responsive base y retirada del ruido editorial.
- Chopper: server-only, read-only, no-leakage y Markdown/link sanitization.

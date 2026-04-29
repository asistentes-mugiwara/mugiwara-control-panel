# Issue 121.3 closeout — Vault frontend explorer + Markdown reader

## Resultado

121.3 sustituye `/vault` por una superficie de dos paneles: explorador de archivos y lector Markdown. La UI legacy basada en cards/editorialización queda retirada.

## Decisiones técnicas

- La página sigue siendo `force-dynamic` y server-side para cargar datos del backend con `MUGIWARA_CONTROL_PANEL_API_URL` privada.
- La selección de documento via query `path` solo se acepta si el path existe en `tree.documents`; si no, se canonicaliza al primer documento seguro.
- El cliente no conoce backend URL ni env; solo recibe árbol/documento ya saneados.
- Markdown se renderiza con parser conservador propio y React nodes, no HTML raw.
- Frontmatter se conserva visible como bloque de código dentro del documento, no como ficha externa.

## Continuidad

121.4 debe cerrar responsive/hardening/canon final:

- afinar mobile/tablet si Usopp detecta problemas;
- ampliar docs vivas de frontend/backend boundary si procede;
- actualizar Project Summary del vault;
- ejecutar smoke Tailscale/post-merge visible;
- cerrar #121 solo tras 121.4.

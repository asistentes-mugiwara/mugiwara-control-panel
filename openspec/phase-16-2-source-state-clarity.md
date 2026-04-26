# Phase 16.2 — Source-state clarity across API-backed pages (#45)

## Objetivo
Cerrar #45 como una microfase UI/copy-only para que las páginas API-backed distingan claramente entre lectura real, fallback local, snapshot saneado, no tiempo real, fuente no configurada y error degradado.

## Decisión de corte
Se comprobó el alcance real y **no se divide en varias PRs** por ahora. Aunque afecta varias rutas, el cambio es homogéneo y limitado a vocabulario UI/copy + un componente compartido de pills de estado de fuente. No toca backend, runtime, adapters, datos expuestos ni contratos API.

Si durante review Usopp/Chopper pidieran cambios de semántica o tratamiento específico para Skills, se cortaría una subfase posterior; no se mezcla ahora con nuevas fuentes ni controles.

## Alcance
- Dashboard: aclarar cuándo muestra snapshot local saneado en vez de lectura real.
- Healthcheck: aclarar fallback/snapshot/no tiempo real sin competir con el triage cerrado en #44.
- Memory: aclarar fallback local y snapshots saneados cuando API Memory no responde o no está configurada.
- Vault: aclarar fallback documental local y no tiempo real.
- Mugiwaras: aclarar fixture saneado vs AGENTS.md canónico desde API allowlisted.
- Skills: aclarar BFF conectado, fuente no configurada, sin datos productivos o error degradado.
- Añadir pills compartidas de source-state.

## Fuera de alcance
- Nuevas API calls.
- Nuevas fuentes Healthcheck.
- Runtime config changes.
- Backend adapters.
- Exponer URLs internas, rutas host, logs, comandos, stdout/stderr o raw errors.

## Diseño
- Crear `SourceStatePills` como componente visual pequeño y reutilizable.
- Evitar usar `Sin datos` como estado primario cuando se está mostrando fallback/snapshot visible; preferir `revision` con copy explícita.
- Mantener códigos técnicos como detalle secundario `Estado técnico: ...`.
- Conservar StatusBadge general del sistema sin ampliar `AppStatus`.

## Definition of Done
- [x] Dashboard distingue API real vs snapshot/fallback.
- [x] Healthcheck distingue API real vs snapshot/fallback.
- [x] Skills, Memory, Vault y Mugiwaras usan vocabulario source-state coherente donde aplica.
- [x] `not_configured` queda como detalle técnico secundario, no mensaje principal.
- [x] No se exponen detalles sensibles.
- [x] Verify web + visual baseline ejecutados.

## Review
- Usopp: UX/copy clarity y consistencia cross-surface.
- Chopper: safety review porque se toca wording de estados/config/error, aunque no se expone detalle nuevo.
- Franky: no requerido; no hay runtime/operación/config change.

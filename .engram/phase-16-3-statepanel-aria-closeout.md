# Phase 16.3 closeout — StatePanel ARIA semantics (#48)

## Resultado
Issue #48 se cierra como microfase única de accesibilidad frontend. `StatePanel` deja de emitir `role="status"` por defecto y ahora expone `ariaRole`/`ariaLabel` para que cada uso declare semántica accesible solo cuando aporte valor.

## Decisión de división
No se divide más: el cambio es pequeño, homogéneo y localizado en componente compartido + un override de Healthcheck + guardrail/docs. Se mantiene separado de #47/#46 para no mezclar semántica ARIA con polish visual o UX de Skills.

## Cambios principales
- `apps/web/src/shared/ui/state/StatePanel.tsx`: default quieto; roles explícitos `status`, `alert`, `region`, `group`; `aria-live` polite/assertive solo para `status`/`alert`.
- `apps/web/src/app/healthcheck/page.tsx`: el panel de prioridad usa `alert` cuando hay incidencia y `region` cuando es aviso no urgente.
- `scripts/check-statepanel-aria.mjs` + `npm run verify:statepanel-aria`: guardrail para evitar volver a hardcodear `role="status"`.
- `docs/frontend-ui-spec.md` y `docs/frontend-implementation-handoff.md`: contrato vivo de semántica accesible de estados.

## Verify
- `npm run verify:statepanel-aria`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:visual-baseline`
- Browser smoke `/healthcheck`: HTTP 200, consola limpia, `role="status"` count 0 y prioridad actual con `role="alert"` + `aria-live="assertive"`.
- `git diff --check`

## Riesgos / follow-ups
- Riesgo bajo: cambio de atributos ARIA sin cambio visual ni runtime.
- Usopp debe revisar la intención accesible y confirmar que no conviene anunciar más usos como `status`/`alert`.
- #47 Dashboard polish y #46 Skills not-configured UX siguen como follow-ups separados.

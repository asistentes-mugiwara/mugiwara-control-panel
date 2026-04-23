# Runtime SDD validation closeout

- phase: runtime-validation
- title: saneado del método SDD headless
- status: closed
- project: mugiwara-control-panel

## Qué se cerró
- Se validó que el patrón de prompt en fichero elimina la contaminación de shell.
- Se confirmó que `sdd-orchestrator-zoro` y `sdd-init-zoro` arrancan realmente desde OpenCode.
- Se documentó que el cuello de botella actual del flujo headless está en `sdd-init`, no en el quoting.
- Se dejó criterio explícito para no confundir sesiones/prompts de Engram con observaciones útiles persistidas.

## Evidencia relevante
- Ejecución foreground de `opencode run` con timeout 600s: arranque correcto, persistencia temprana en Engram y delegación a `sdd-init-zoro`, pero sin pasar de init antes del timeout.
- Sesiones observadas en OpenCode DB: `ses_245f44ad0ffeWOvdwfU5JfZxAp`, `ses_245f2ee19ffeRGNtgX9q0ONSlm`, `ses_245f230c0ffegDllK96Cl9tzXF`, `ses_245f115beffe6dXSg3roPqPcmB`.
- Engram DB: nuevas filas en `sessions`, sin nuevas filas útiles verificables en `observations` para esta validación.

## Decisiones importantes
- No exigir `sdd-init` en cada mini-fase corta del proyecto si el contexto sigue vigente.
- Validar Engram por `observations` antes de afirmar que cada agente SDD guardó su artefacto.
- Separar una futura demostración `init -> archive` en una ejecución dedicada o interactiva.

## Riesgos
- El método headless sigue sin demostrar cierre completo del flujo SDD.
- La persistencia útil por subagente en Engram sigue sin quedar probada.

## Siguiente paso recomendado
- Continuar la siguiente fase del producto desde la fase SDD coherente posterior a init, evitando pagar init completo otra vez salvo que cambie el contexto.
- Programar una validación específica del ciclo completo cuando se pueda dar a `sdd-init` una ventana más larga y auditada.

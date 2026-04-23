# Mini-fase técnica — validación del runtime SDD

## Objetivo
Validar el método de ejecución SDD desde Hermes/OpenCode para este proyecto, distinguiendo:
- quoting/escaping del shell
- comportamiento real del orquestador
- coste y rol de `sdd-init`
- persistencia efectiva en Engram

## Scope
- No introducir features de producto.
- Documentar el estado del runtime y fijar reglas operativas más fiables.
- Añadir artefactos de continuidad para evitar seguir iterando con falsas asunciones.

## Decisiones
- El patrón canónico de invocación desde Hermes pasa a ser prompt en fichero + `$(cat fichero)`.
- `sdd-init` no debe exigirse en cada mini-fase corta cuando el proyecto ya está rehidratado.
- El éxito de Engram se valida contra `observations`, no solo contra `sessions` o prompts guardados.
- Para una demostración real de flujo extremo a extremo, `sdd-init` debe aislarse en una ejecución propia con timeout más generoso o en sesión interactiva.

## Evidencia técnica base
- `opencode run` con prompt seguro arrancó sin contaminación de bash.
- `sdd-orchestrator-zoro` y `sdd-init-zoro` quedaron registrados en `~/.local/share/opencode/opencode.db`.
- `sdd-init-zoro` arrancó con `openai/gpt-5.4`.
- La ejecución headless de 600s expiró sin pasar de init.
- Engram registró sesiones y prompts, pero no dejó nuevas observaciones útiles verificables para esta validación.

## Definition of done
- Artefacto documental en `docs/` con evidencia y conclusión.
- Artefacto OpenSpec con decisiones de método y criterio de uso.
- Checklist de verify específico para futuras validaciones runtime.
- Cierre en `.engram/` con resultado, riesgos y siguiente paso.

## Riesgos activos
- Seguir obligando `sdd-init` en cada mini-fase cortará el flujo antes de llegar a fases útiles.
- Dar por buena la persistencia de Engram sin comprobar `observations` mantendrá una falsa sensación de cierre.
- Repetir `opencode run` headless con timeout corto puede volver a truncar la sesión antes de `sdd-verify` y `sdd-archive`.

## Próximo uso previsto
Esta mini-fase debe servir como base para ajustar el método de ejecución de las siguientes fases del proyecto y para futuras reparaciones del runtime de Zoro.

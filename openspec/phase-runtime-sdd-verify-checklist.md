# Verify checklist — mini-fase runtime SDD

## Comprobaciones mínimas
- [ ] La invocación usa prompt en fichero, no prompt complejo inline.
- [ ] `opencode run` arranca desde `/srv/crew-core/projects/mugiwara-control-panel`.
- [ ] La sesión principal usa `sdd-orchestrator-zoro`.
- [ ] Si hay `sdd-init`, queda registrado como subagente real y con el modelo esperado.
- [ ] Se distingue entre sesión iniciada y observación persistida en Engram.
- [ ] No se inventa éxito de `sdd-verify`/`sdd-archive` si la ejecución no llegó a esas fases.
- [ ] No se suben temporales, prompts locales ni salidas sensibles al repo público.

## Auditoría Engram
- [ ] Revisar `sessions` de `~/.engram/engram.db` para confirmar arranque.
- [ ] Revisar `observations` de `~/.engram/engram.db` para confirmar persistencia útil real.
- [ ] Documentar explícitamente si solo hubo `session_start` y `save_prompt`.

## Criterio de cierre
La mini-fase puede cerrarse si deja evidencia suficiente para decidir cómo operar la siguiente fase, aunque el flujo SDD extremo a extremo todavía no haya quedado demostrado.

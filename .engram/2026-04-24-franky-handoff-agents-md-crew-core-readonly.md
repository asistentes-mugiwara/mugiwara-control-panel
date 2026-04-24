# Franky -> Zoro handoff — crew-core AGENTS.md en panel Mugiwara

Fecha: 2026-04-24
Agente origen: Franky
Agente destino: Zoro

## Decisión de Pablo

En el panel Mugiwara Hermes, la página de Mugiwara debe mostrar el `AGENTS.md` canónico de crew-core en modo solo lectura.

Fuente canónica:

```text
/srv/crew-core/AGENTS.md
```

## Contexto operativo

- `/home/agentops/.hermes/hermes-agent/AGENTS.md` ya no debe tratarse como documento independiente.
- Esa ruta es ahora un symlink a `/srv/crew-core/AGENTS.md`.
- El panel debe mostrar solo la fuente canónica de crew-core para evitar duplicidad/confusión.

## Requisito para implementación

En la página/sección de Mugiwara del `mugiwara-control-panel`:

- Añadir acceso de lectura a `/srv/crew-core/AGENTS.md`.
- Mostrarlo como documento canónico de reglas operativas Mugiwara.
- Solo lectura: sin edición desde el panel en esta fase.
- No listar por separado el symlink de Hermes Agent.

## Riesgo a evitar

No presentar `hermes-agent/AGENTS.md` y `crew-core/AGENTS.md` como dos fuentes distintas, porque ahora representan el mismo canon y una duplicidad en UI confundirá a humanos/agentes.

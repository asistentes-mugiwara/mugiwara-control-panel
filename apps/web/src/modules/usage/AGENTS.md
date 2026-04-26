# AGENTS.md — apps/web/src/modules/usage

## Rol
Módulo frontend para la superficie `/usage` de uso Codex/Hermes.

## Reglas
- Consumir Usage desde adapters server-only; no usar `NEXT_PUBLIC_*` ni URL backend en cliente.
- Mantener la página read-only.
- Usar siempre `ciclo semanal Codex`; no presentar el ciclo como semana natural lunes-domingo.
- No exponer prompts, raw conversations, tokens, user/account IDs, headers ni raw payload.
- El calendario por fecha natural consume solo el endpoint backend allowlisted; ventanas históricas dedicadas y actividad Hermes agregada pertenecen a fases posteriores separadas.

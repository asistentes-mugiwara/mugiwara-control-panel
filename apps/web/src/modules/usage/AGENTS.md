# AGENTS.md — apps/web/src/modules/usage

## Rol
Módulo frontend para la superficie `/usage` de uso Codex/Hermes.

## Reglas
- Consumir Usage desde adapters server-only; no usar `NEXT_PUBLIC_*` ni URL backend en cliente.
- Mantener la página read-only.
- Usar siempre `ciclo semanal Codex`; no presentar el ciclo como semana natural lunes-domingo.
- No exponer prompts, conversaciones crudas, payloads de herramientas, tokens por sesión/conversación, user/account IDs, chat IDs, delivery targets, headers, cookies, secretos, rutas internas ni raw payload.
- El calendario por fecha natural, las ventanas 5h históricas y la actividad Hermes agregada consumen solo endpoints backend allowlisted; la actividad Hermes se presenta como correlación orientativa, no como causalidad exacta.

# AGENTS.md — apps/api/src/modules/usage

## Rol
Módulo backend read-only para snapshots saneados de uso Codex/Hermes.

## Reglas
- Leer solo la fuente SQLite allowlisted de uso saneado.
- No exponer email, user_id, account_id, tokens, headers, prompts, logs brutos ni raw payload.
- No convertir Usage en filesystem browser ni consola host.
- Mantener la semántica `ciclo semanal Codex`, no “semana” de calendario.
- Las ventanas 5h históricas deben salir solo de la SQLite allowlisted en modo lectura, agrupadas por inicio/reset normalizado a minuto UTC y sin paths runtime.
- La actividad Hermes local debe permanecer agregada y saneada cuando se añada en fases posteriores.

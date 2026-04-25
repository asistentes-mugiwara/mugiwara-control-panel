# AGENTS.md — ops/systemd/user

## Rol
Unidades systemd de usuario para automatizaciones locales de bajo privilegio.

## Reglas
- No fijar `User=`/`Group=` dentro de unidades user-level; el usuario operativo instalador define el contexto.
- Mantener `ExecStart` acotado a comandos revisados del repo.
- No pasar overrides de rutas sensibles (`--output`, `--repo`) salvo revisión explícita.
- Documentar si la unidad usa red; por defecto no debe hacerlo.

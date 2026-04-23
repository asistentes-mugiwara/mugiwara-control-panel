# Project memory bootstrap

- project: mugiwara-control-panel
- created_at: 2026-04-23T10:45:12.195583+02:00
- purpose: control plane privado de Mugiwara/Hermes
- stack_target: Next.js + FastAPI
- architecture_target: monolito modular con clean architecture por módulo
- access_model: Tailscale only
- mvp_policy: lectura casi total y escritura solo de skills
- critical_rule: abrir OpenCode siempre desde `/srv/crew-core/projects/mugiwara-control-panel` para contexto SDD correcto y Engram en el espacio del proyecto correcto
- public_repo_risk: vigilar `.gitignore` de forma continua porque el repositorio será público en GitHub

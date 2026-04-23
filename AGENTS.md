# AGENTS.md — mugiwara-control-panel

## Propósito del proyecto
`mugiwara-control-panel` es el control plane privado de Mugiwara/Hermes para observabilidad, navegación y edición controlada de skills.

## Principios de arquitectura
- Monolito modular con separación clara entre `apps/web`, `apps/api` y paquetes compartidos.
- Clean Architecture por módulo: dominio -> aplicación -> infraestructura/adapters -> interfaz.
- El backend es la frontera de seguridad: deny-by-default, allowlists explícitas y nada de acceso arbitrario al filesystem.
- El frontend prioriza lectura del sistema; la única capacidad de escritura prevista en el MVP es sobre skills permitidas.

## Reglas operativas obligatorias
- **Vigilar `.gitignore` de forma obsesiva.** Este repositorio se va a exponer públicamente en GitHub.
- Nunca se deben versionar `.env`, secretos, tokens, credenciales, cookies, dumps locales, logs sensibles, salidas de healthchecks con datos delicados, snapshots de memoria ni artefactos temporales del host.
- Si aparece una ruta nueva o tooling nuevo, revisar inmediatamente si debe entrar en `.gitignore` antes de hacer commit.
- Mantener `README.md`, `docs/` y todos los `AGENTS.md` siempre actualizados cuando cambie la estructura, el flujo o las decisiones relevantes.
- Si una carpeta cambia de responsabilidad, su `AGENTS.md` debe cambiar en el mismo PR/commit.

## Regla OpenCode + Engram
- Cuando este proyecto se trabaje con OpenCode, **siempre** se debe iniciar desde la raíz del proyecto: `/srv/crew-core/projects/mugiwara-control-panel`.
- No abrir OpenCode desde carpetas padre, desde `/srv/crew-core/projects` ni desde subcarpetas sueltas salvo que haya un motivo técnico muy justificado.
- Esta regla existe para que los agentes SDD arranquen con el contexto correcto y para que Engram se actualice en el espacio del proyecto correcto.

## Capas de conocimiento
- `.engram/` = memoria viva local del proyecto y artefactos de continuidad técnica.
- `docs/` = documentación viva del repo.
- `openspec/` = especificación/planificación formal del proyecto.
- `vault` = canon curado externo al repo cuando corresponda.

## Estructura inicial
- `apps/web` -> frontend Next.js
- `apps/api` -> backend FastAPI
- `packages/contracts` -> contratos/tipos/esquemas compartidos
- `packages/ui` -> componentes o tokens UI compartidos si llegan a ser necesarios
- `docs` -> arquitectura, ADRs y notas del proyecto
- `tests` -> pruebas transversales/end-to-end
- `scripts` -> automatización segura y explícita del repo

## Política de documentación
- No dejar directorios importantes sin `AGENTS.md`.
- Documentar decisiones de arquitectura antes o junto con cambios no triviales.
- Mantener ejemplos saneados y seguros para repositorio público.

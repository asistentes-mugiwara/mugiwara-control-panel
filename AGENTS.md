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
- Antes de cada fase, revalidar que la sesión/arranque de OpenCode está anclado a esta ruta exacta.

## Modo de trabajo con agentes
- Este proyecto se diseña y ejecuta pensando primero en **agentes**, no en flujos humanos manuales.
- Las interfaces, contratos y módulos deben estar preparados para consumo claro por agentes: inputs explícitos, outputs tipados, estados observables y rutas estables.
- Priorizar orquestación determinista, trazabilidad, seguridad y superficies pequeñas de acción.
- Evitar flujos ambiguos, side effects implícitos y dependencias mágicas entre módulos.

## Cadencia de entrega por mini-fases
- Trabajar en mini-fases muy acotadas para evitar iteraciones infinitas.
- Cada mini-fase debe recorrer el flujo SDD que corresponda: explorar -> spec/design -> tareas -> apply/verify cuando aplique.
- Al cerrar cada mini-fase: actualizar documentación, guardar continuidad en `.engram/`, cerrar OpenCode y devolver estado antes de pasar a la siguiente.
- Cada mini-fase cerrada debe terminar con `commit` y `push`.
- Usar `judgment-day` cuando el riesgo, el alcance o la sensibilidad del cambio justifiquen una revisión extra de cierre.

## Criterios de calidad y seguridad
- Mantener buenas prácticas de código, seguridad, observabilidad y diseño modular desde el principio.
- Favorecer contratos pequeños, testables y verificables.
- No introducir acceso de escritura fuera de la superficie MVP permitida sin decisión explícita documentada.
- Documentar cualquier decisión estructural relevante en el mismo cambio que la introduce.

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

# Desarrollo inicial

## Regla de contexto
Trabajar siempre desde la raíz del proyecto para OpenCode, tooling y Engram.

## Prioridades iniciales
1. modelado de módulos del backend
2. shell del frontend
3. contratos compartidos
4. política de lectura/escritura segura para skills

## Planificación por mini-fases
- La secuencia actual de mini-fases vive en `openspec/phase-1-mini-fases.md`.
- Las decisiones cerradas de la fase 1 viven en `openspec/phase-1-diseno.md`.
- No arrancar una fase nueva sin revisar verify, riesgos y criterio de `judgment-day` de la fase correspondiente.

## Regla documental
Cualquier cambio estructural debe actualizar `README.md`, `docs/` y `AGENTS.md` relevantes.

## Runtime SDD desde Hermes/OpenCode
- Para prompts complejos, usar fichero de prompt + invocación segura; referencia: `scripts/opencode-safe-run.sh`.
- No forzar `sdd-init` en cada mini-fase corta si el proyecto ya está rehidratado.
- En continuaciones headless, pasar explícitamente `--agent sdd-orchestrator-zoro` junto con `--session` para evitar deriva de la sesión raíz al agente `build`.
- No declarar éxito de persistencia en Engram sin comprobar observaciones reales además de sesiones/prompts.
- Evidencia y criterio operativo actual: `docs/sdd-runtime-validation.md`.

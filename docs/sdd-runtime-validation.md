# Validación del runtime SDD desde Hermes/OpenCode

## Objetivo
Dejar evidencia técnica sobre el estado real del flujo SDD headless para este proyecto y fijar una forma de operación más fiable.

## Alcance
Esta mini-fase valida método, no producto:
- arranque seguro de `opencode run` con prompt en fichero
- comportamiento del orquestador `sdd-orchestrator-zoro`
- comportamiento de `sdd-init-zoro`
- persistencia real en Engram
- gaps operativos detectados

## Evidencia observada
### Invocación segura
La invocación con prompt en fichero evita la contaminación de Bash observada en fases previas. Con este patrón no reaparecieron errores tipo:
- `command not found`
- `Is a directory`
- rutas/backticks interpretados por shell

### Sesiones OpenCode reales
Durante esta validación se observaron sesiones reales en `~/.local/share/opencode/opencode.db`:
- `ses_245f44ad0ffeWOvdwfU5JfZxAp` — `Runtime SDD validation`
- `ses_245f2ee19ffeRGNtgX9q0ONSlm` — `Run SDD init (@sdd-init-zoro subagent)`
- `ses_245f230c0ffegDllK96Cl9tzXF` — `Runtime SDD validation`
- `ses_245f115beffe6dXSg3roPqPcmB` — `Run SDD init (@sdd-init-zoro subagent)`

### Engram real durante la ejecución
Se observaron persistencias tempranas de sesión/prompt:
- `engram_mem_session_start`
- `engram_mem_save_prompt`

También quedaron filas nuevas en `~/.engram/engram.db` dentro de `sessions`:
- `session-2026-04-23-runtime-sdd-validation`
- `ses_245f230c0ffegDllK96Cl9tzXF`

## Hallazgos principales
### 1. El quoting del shell ya no es el cuello de botella principal
El patrón de prompt en fichero funciona y elimina la contaminación previa del comando.

### 2. `sdd-init-zoro` ya arranca con `gpt-5.4`
La sesión hija de init quedó registrada con `agent=sdd-init-zoro` y `model=gpt-5.4`.

### 3. El flujo headless sigue atascándose en `sdd-init`
En una ejecución foreground de `opencode run` con timeout externo de 600s, el trabajo no pasó de:
- orquestador arrancado
- persistencia temprana en Engram
- delegación a `sdd-init-zoro`

La ejecución expiró antes de alcanzar `sdd-explore`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-verify` o `sdd-archive`.

### 4. `sdd-init` sigue siendo demasiado pesado para usarlo en cada mini-fase headless
La skill `~/.config/opencode/skills/sdd-init/SKILL.md` obliga a:
- escanear skills de múltiples directorios globales y de proyecto
- construir `.atl/skill-registry.md`
- guardar el skill registry en Engram
- persistir contexto del proyecto al final

Eso convierte `sdd-init` en una fase costosa y frágil para lanzarla desde Hermes en cada mini-fase corta.

### 5. Engram no está demostrando persistencia útil por subagente
En el momento del cierre de esta validación, `observations` en `~/.engram/engram.db` seguía sin nuevas observaciones útiles para las fases recientes. Lo que sí apareció fue:
- sesiones nuevas
- prompts guardados

No hay evidencia suficiente de que cada subagente SDD esté dejando su observación útil propia de forma consistente.

## Conclusión operativa
La operación más sana a partir de aquí es:
1. usar prompt seguro en fichero siempre que Hermes invoque `opencode run`
2. tratar `sdd-init` como fase de bootstrap/rehidratación: una vez por proyecto y, después, una vez por sesión de trabajo cuando haga falta recuperar contexto
3. no relanzar `sdd-init` por cada fase si la continuidad de la sesión sigue vigente
4. si Hermes crea runs headless frescos para cada mini-fase, asumir que puede volver a pagar `init` y distorsionar el método
5. para validar flujo completo headless, separar `sdd-init` en una ejecución dedicada con timeout generoso o usar continuación explícita de sesión
6. no declarar éxito de persistencia en Engram hasta verificar observaciones reales, no solo sesiones o prompts

## Recomendación para siguientes fases
- Si se sigue desde Hermes/headless: arrancar desde la fase coherente posterior a init cuando el contexto del proyecto ya esté rehidratado.
- Si se quiere demostrar el ciclo completo `init -> archive`: usar una sesión más larga o interactiva, y auditar Engram al final con consulta explícita de `observations`.

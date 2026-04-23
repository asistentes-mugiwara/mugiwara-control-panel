# Phase 5 — skills surface

## Scope
Acotar la única superficie editable del MVP: edición controlada de skills autorizadas.

## Decisions
- La escritura del MVP queda limitada a `SKILL.md` explícitamente autorizados por backend.
- El cliente no resuelve rutas libres ni escribe directamente en filesystem.
- La allowlist vive en backend y se resuelve por identificador interno de skill.
- Cada guardado debe quedar auditado con metadata mínima y diff resumido.
- Git no sustituye la auditoría operacional de backend.

## Definition of done
- superficie editable descrita y limitada
- allowlist y reglas deny-by-default documentadas
- requisitos mínimos de auditoría y diff definidos
- verify checklist cerrable para fase documental
- closeout en `.engram/` con estado, método y riesgos

## Verify expected
- coherencia con la política read-only del MVP
- ausencia de escritura libre por path
- trazabilidad mínima definida antes de aceptar guardado de skills
- alineación con repositorio público y vigilancia de `.gitignore`

## Método observado en esta fase
- Se intentó continuar la sesión SDD existente para evitar relanzar `sdd-init`.
- El runtime no reabrió `sdd-init` y sí alcanzó al menos una subfase `sdd-explore-zoro`.
- La sesión raíz continuada apareció bajo `build`, no bajo `sdd-orchestrator-zoro`, así que el flujo SDD quedó solo parcialmente cumplido y hubo que rescatar el cierre documental inline.

## Judgment-day trigger
Aplicar `judgment-day` cuando esta superficie pase a implementación real y exista riesgo de escritura fuera de allowlist, bypass de auditoría o exposición accidental de rutas/secretos.

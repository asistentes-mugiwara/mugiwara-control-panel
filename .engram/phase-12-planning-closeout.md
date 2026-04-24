# Phase 12 planning closeout

## Resultado
- Se planificó Phase 12 como bloque de integración backend read-only para superficies MVP no cubiertas todavía por API real: `mugiwaras`, `memory`, `vault`, `healthcheck` y `dashboard`.
- La fase queda dividida en seis subfases pequeñas y verificables:
  1. contratos read-only compartidos,
  2. vertical API de `mugiwaras`,
  3. vertical API de `memory`,
  4. vertical API de `vault`,
  5. `healthcheck` + agregación de `dashboard`,
  6. hardening/cierre del bloque.

## Decisión técnica
- Phase 12 no debe abrir nuevas escrituras; `skills` sigue siendo la única superficie editable del MVP.
- El backend continúa como frontera de seguridad: deny-by-default, allowlists explícitas y cero acceso arbitrario al host.
- `mugiwaras` se elige como primer vertical API-backed porque es el menor riesgo y puede fijar el patrón para las demás superficies.
- `memory`, `vault` y `healthcheck` se separan en subfases propias por riesgo de exposición accidental.

## Verify ejecutado
- Revisión de estado Git y rama actual.
- Revisión de docs y specs previas: `docs/read-models.md`, `docs/api-modules.md`, `docs/frontend-ui-spec.md`, `docs/frontend-implementation-handoff.md`, specs Phase 9/10/11.
- `git diff --check` sobre los artefactos de planificación.

## Riesgos abiertos
- `vault` y `memory` requieren tests de rechazo/leakage antes de implementación.
- `healthcheck` no debe derivar hacia consola remota ni comando host arbitrario.
- Habrá que decidir en cada subfase si el dato real existe ya o si se mantiene un adapter backend con fixture saneada como paso intermedio.

# Phase 4 — shared contracts design

## Scope
Diseñar `packages/contracts` como capa común entre backend y frontend para recursos del MVP.

## Decisions
- Los contratos compartidos modelan recursos, estados, errores y metadata común.
- Se adopta un shape base de respuesta con `resource`, `status`, `data` y `meta`.
- Los estados compartidos mínimos serán `ready`, `empty`, `error` y `stale`.
- Los errores compartidos se expresarán como categorías semánticas, no solo mensajes libres.
- El versionado de contratos seguirá criterio semántico desde el inicio.

## Definition of done
- `packages/contracts` queda definido como responsabilidad clara
- shape base de respuestas documentado
- estrategia de errores/estados compartidos documentada
- criterio de versionado documentado
- checklist de verify cerrable

## Verify expected
- alineación con fase 2 backend y fase 3 frontend
- ausencia de lógica de negocio en la capa de contratos
- contratos no más expresivos que la política de seguridad del backend

## Judgment-day trigger
Aplicar `judgment-day` cuando estos contratos pasen a implementación efectiva y cualquier cambio pueda romper acoplamiento entre backend y frontend o introducir exposición accidental de datos.

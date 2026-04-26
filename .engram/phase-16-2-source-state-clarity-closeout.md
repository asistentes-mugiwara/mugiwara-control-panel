# Phase 16.2 closeout — Source-state clarity (#45)

## Resultado
#45 se aborda como una microfase única UI/copy-only. Se comprobó que dividir por página generaría overhead sin reducir riesgo real: todas las superficies comparten el mismo problema de vocabulario y se resuelven con un componente visual común y copys consistentes.

## Decisiones
- No ampliar `AppStatus`; se usa `revision` para fallback visible en vez de `sin-datos` cuando hay snapshot/fixture renderizado.
- Códigos técnicos (`not_configured`, `invalid_config`, etc.) quedan como `Estado técnico: ...`, secundarios.
- `SourceStatePills` fija vocabulario visual reusable: `API real conectada`, `Modo fallback local`, `Snapshot saneado`, `No tiempo real`, `Fuente no configurada`, `Error/degradado`.
- Chopper entra como reviewer de seguridad por wording de config/error, aunque el cambio no expone detalles nuevos.

## Verify
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run build`
- `npm run verify:visual-baseline`
- `git diff --check`
- HTTP smoke local sobre `/dashboard`, `/healthcheck`, `/mugiwaras`, `/memory`, `/vault` y `/skills`: todas 200.
- Browser smoke local sobre las seis rutas: source-state visible y consola JS sin errores.

## Continuidad
Si Usopp pide compactar algún aviso concreto, hacerlo en una ronda corta. Si Chopper detecta cualquier leakage semántico, corregir copy sin tocar backend.

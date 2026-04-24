# Phase 12.3b closeout — memory frontend API integration

## Resultado
- `/memory` se integra con la API read-only de Phase 12.3a.
- La ruta se divide en loader server-side (`page.tsx`) y componente cliente (`MemoryClient.tsx`).
- La UI mantiene selección interactiva por Mugiwara y tabs Built-in/Honcho sin hacer fetch directo desde navegador.
- Si falta o falla la API, la página cae a fixture saneado y muestra aviso explícito.

## Decisión técnica
El fetch de Memory queda server-side para evitar CORS en browser y mantener la frontera de datos más controlada. El cliente recibe solo datos saneados ya cargados o fallback local.

## Verify ejecutado
- `npm --prefix apps/web run typecheck` → OK.
- `npm --prefix apps/web run build` → OK.
- Backend regression: `PYTHONPATH=. pytest apps/api/tests/test_memory_api.py apps/api/tests/test_mugiwaras_api.py apps/api/tests/test_shared_contracts.py apps/api/tests/test_skills_api.py` → 15 passed.
- Smoke local API + web: `/memory` renderiza `API solo lectura`; Built-in y Honcho para Zoro muestran contenido API-backed; consola del navegador sin errores tras carga e interacción.
- Tras review de Usopp: se corrigió wrapping de `StatusBadge`, semántica de tabs y copy `API solo lectura`.

## Riesgos abiertos
- La integración sigue usando catálogo saneado backend-owned; conectar stores reales queda fuera de alcance y requerirá nueva revisión de Chopper.
- El server loader pide detalle para todos los Mugiwara conocidos; aceptable para catálogo pequeño, pero si crece convendrá endpoint agregado o lazy server action/proxy.
- PR requiere Chopper + Usopp por mezclar frontera de datos y UI visible.

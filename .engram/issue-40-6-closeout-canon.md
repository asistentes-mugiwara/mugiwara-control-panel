# Issue #40.6 closeout — Git control page canon

## Contexto
PR #93 cerró Issue #40.5 con selector controlado repo/commit en `/git`. Chopper aprobó tras mover la canonicalización anti-echo a `apps/web/src/middleware.ts`, porque `redirect()` desde Server Component podía devolver HTML/RSC intermedio con la query original. Usopp dejó `mergeable_with_minor_followups` sin bloquear el merge.

## Decisión
La siguiente microfase elegida es A) closeout/canon del bloque 40.1–40.5.

Motivo: el bloque Git control ya entrega valor read-only suficiente y seguro. Abrir ahora refs/rangos/revspecs, remotes, acciones Git, working-tree diff o líneas de diff en DOM introduciría capacidad sensible sin necesidad explícita ni review nueva.

## Estado cerrado
- 40.1: backend registry/status read-only.
- 40.2: backend commits/branches read-only.
- 40.3: commit detail + safe diff backend deny-by-default.
- 40.4: frontend `/git` server-only/read-only.
- 40.5: selector controlado repo/commit con canonicalización temprana anti-echo RSC.

## Restricciones vivas
- Cliente solo usa `repo_id` allowlisteado y SHA backend-owned.
- Sin paths, remotes, refs, rangos, revspecs, comandos Git ni discovery arbitrario desde cliente.
- Sin acciones Git mutables o remotas.
- Sin working-tree diff.
- Sin render de líneas de diff en HTML/DOM.
- Cualquier nueva capacidad Git requiere fase explícita y review adecuada.

## Verify de esta microfase
Docs/OpenSpec/.engram-only: `git diff --check`.

## Continuidad
Si Pablo pide continuar Git control, no implementar directamente. Primero elegir una ruta explícita:
1. follow-up operativo/performance del middleware `/git` con Franky;
2. polish UI menor con Usopp;
3. nueva planificación para capacidad Git concreta con Franky/Chopper/Usopp según riesgo.

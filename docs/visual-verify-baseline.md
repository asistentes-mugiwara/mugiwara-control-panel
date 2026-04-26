# Visual verify baseline — Mugiwara Control Panel MVP

## Objetivo
Dejar una base **pequeña, repetible y sostenible** para verify visual/manual del MVP actual sin depender todavía de e2e visual automatizado.

## Comando canónico
```bash
npm run verify:visual-baseline
```

Este comando imprime la checklist canónica por **viewport** y por **ruta**.

## Viewports canónicos
- **Desktop** — `1440×900`
- **Tablet** — `1024×768`
- **Mobile** — `390×844`

## Rutas obligatorias
- `/dashboard`
- `/mugiwaras`
- `/skills`
- `/memory`
- `/vault`
- `/healthcheck`

## Qué revisar siempre
### Shell
- sidebar/topbar estables según viewport
- foco y navegación utilizables
- ausencia de overflow horizontal obvio

### Jerarquía visual
- header, subtitle, pills y badges legibles
- cards con ritmo visual consistente
- estados vacíos/error/stale sin colapsar el layout
- cuando haya fallback visible, las pills `Modo fallback local`, `Snapshot saneado` y/o `No tiempo real` deben aclarar que el contenido no es API real
- en `/healthcheck`, la prioridad actual debe verse antes del grid y los checks sanos no deben competir visualmente con incidencias o advertencias

### Responsive fino
- grids apilan paneles con dignidad
- chips, labels y badges hacen wrap limpio
- bloques `code/pre`, fingerprints, paths y previews largos no rompen contenedores

## Cierre mínimo esperado
Además de `typecheck`, `build` y `git diff --check`, en cierres UI relevantes conviene:
1. recorrer la checklist del comando canónico
2. revisar la consola del navegador en las rutas tocadas
3. dejar nota breve de incidencias o confirmación en `.engram/phase-XX-closeout.md`

## Dev server local
Para inspección local desde navegador se permite usar `http://127.0.0.1:3000` o `http://localhost:3000`.
Ambos orígenes están declarados en `apps/web/next.config.ts` mediante `allowedDevOrigins` para evitar ruido de consola en `next dev`.

## Nota
Esta baseline es **manual y deny-by-default**: fija qué revisar siempre. La automatización visual futura podrá partir de esta misma matriz de viewports/rutas en vez de improvisar nuevas listas.

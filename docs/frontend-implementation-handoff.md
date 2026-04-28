# Frontend implementation handoff — Mugiwara Control Panel MVP

## Estado
- **Owner:** Usopp
- **Destinatario principal:** Zoro
- **Documento base obligatorio:** `docs/frontend-ui-spec.md`
- **Propósito:** traducir la spec de UI en decisiones de implementación frontend concretas y sin ambigüedad

---

# 1. Instrucción operativa para Zoro

Este documento complementa `docs/frontend-ui-spec.md`.

## Obligatorio
Cuando implementes frontend en `apps/web`:
1. **usa `docs/frontend-ui-spec.md` como contrato de producto/UI**
2. **usa este handoff como guía de traducción a código**
3. si cambias estructura, componentes compartidos, rutas o assets, **actualiza ambos documentos en el mismo cambio**

## No hacer
- no introducir una landing separada dentro del MVP
- no meter `vault` dentro de `memory`
- no abrir superficies de escritura fuera de `skills`
- no improvisar colores, estructuras o componentes fuera del sistema definido

---

# 2. Orden recomendado de implementación

## Fase 1 — foundation del shell
Entregar primero:
- `app/layout.tsx`
- `dashboard/page.tsx`
- navegación lateral
- topbar
- page header
- tokens de color / tema
- componentes base de superficie y estado

## Fase 2 — pantallas core de lectura
Después:
- `mugiwaras`
- `memory`
- `vault`
- `healthcheck`
- `usage` current-state

## Fase 3 — pantalla productiva
Después:
- `skills`
- detalle y affordances de edición controlada

## Fase 4 — refinamiento
- responsive fino
- estados vacíos y errores
- pulido de contraste y ritmo visual
- extracción a `packages/ui` solo si ya hay masa crítica real

## Fase 5 — ideas rescatadas de la exploración landing
Incorporar solo las ideas que mejoran el shell sin convertirlo en landing:
- `Estado del barco` como heading editorial del dashboard
- bloque de `Tripulación activa` como resumen navegable, no como póster
- panel `Señales del sistema`
- panel `Incidencias recientes`
- franja opcional de principios de seguridad (`Código público. Operación privada`)
- callouts que separen mejor `memory` vs `vault`

Regla: si una idea rescatada compite con claridad o con la taxonomía de 6 módulos, se descarta.

---

# 3. Estructura de carpetas recomendada

## 3.1 App router
```text
apps/web/src/app/
  layout.tsx
  page.tsx                  # redirige a /dashboard o actúa como alias limpio
  dashboard/page.tsx
  mugiwaras/page.tsx
  mugiwaras/[slug]/page.tsx         # opcional si el detalle vive por ruta
  skills/page.tsx
  skills/[skillId]/page.tsx         # opcional
  memory/page.tsx
  memory/[slug]/page.tsx            # opcional
  vault/page.tsx
  vault/[...path]/page.tsx          # opcional si la navegación es por ruta
  healthcheck/page.tsx
  usage/page.tsx                    # Usage Codex/Hermes current-state + calendario + ventanas 5h
```

## 3.2 Módulos funcionales
```text
apps/web/src/modules/
  dashboard/
    components/
    view-models/
    index.ts
  mugiwaras/
    components/
    view-models/
    index.ts
  skills/
    components/
    view-models/
    index.ts
  memory/
    components/
    view-models/
    index.ts
  vault/
    components/
    view-models/
    index.ts
  healthcheck/
    components/
    view-models/
    index.ts
  usage/
    api/
    view-models/
    index.ts
  system/
    api/                  # adapter server-only para métricas globales del header
    view-models/          # snapshot serializable para AppShell/Topbar
    index.ts              # opcional si el módulo crece
```

## 3.3 Shared
```text
apps/web/src/shared/
  ui/
    app-shell/
    cards/
    status/
    navigation/
    filters/
    feedback/
  mugiwara/
    crest/
    palette/
    identity/
  theme/
    tokens.ts
    semantic-colors.ts
    mugiwara-colors.ts
  lib/
    classnames.ts
```

## 3.4 Cuándo extraer a `packages/ui`
Solo cuando existan:
- al menos 4–5 componentes realmente estables y reutilizados
- necesidad real de compartir tokens/componentes fuera de `apps/web`
- API clara y documentada

Antes de eso, mantenerlo en `apps/web/src/shared`.

---

# 4. Tokens, tema y semántica

## 4.1 Regla
No hardcodear hex dispersos en componentes.

## 4.2 Capas de tokens
Separar en tres capas:

### A. Brand tokens
Colores base del producto:
- navy
- blue
- sky
- gold
- red
- brown
- pearl

### B. Semantic tokens
Estados universales:
- success
- warning
- danger
- stale
- neutral

### C. Mugiwara identity tokens
Acentos por personaje:
- `mugiwara.luffy.primary`
- `mugiwara.zoro.primary`
- etc.

## 4.3 Forma sugerida
```ts
export const brand = {
  navy900: '#183A83',
  blue700: '#2561CE',
  sky500: '#5A9DDB',
  gold400: '#FFE347',
  red600: '#C94128',
  brown700: '#503528',
  pearl100: '#E8E8E8',
}
```

```ts
export const semantic = {
  success: '#3FAF6B',
  warning: '#D9A441',
  danger: '#C94128',
  stale: '#C97B2E',
  neutral: '#6C7891',
}
```

```ts
export const mugiwaraColors = {
  luffy: { primary: '#FFE347', accent: '#C94128' },
  zoro: { primary: '#2F6B3B', accent: '#111111' },
  nami: { primary: '#E97A2E', accent: '#2B63C6' },
  usopp: { primary: '#C79A2B', accent: '#3D6C3A' },
  sanji: { primary: '#314A63', accent: '#D8B55B' },
  chopper: { primary: '#E889B5', accent: '#6CB7E8' },
  robin: { primary: '#6D4AA8', accent: '#2A173E' },
  franky: { primary: '#4FB7E8', accent: '#D84032' },
  brook: { primary: '#2B2138', accent: '#D8C34A' },
} as const
```

---

# 5. Inventario técnico de componentes a crear primero

## 5.1 Layout
### `AppShell`
Responsabilidades:
- compone sidebar + topbar + content area
- maneja responsive shell
- no contiene lógica de dominio

### `SidebarNav`
- lista estable de 6 rutas
- icono + label
- estado activo

### `Topbar`
- identidad del panel
- última actualización
- estado global resumido
- placeholder de búsqueda/comando
- en móvil, permitir wrap y degradar primero chips secundarios antes que identidad/estado

### `PageHeader`
- `title`
- `subtitle`
- emblema visual general con `laya-mugiwara.jpg` mediante componente compartido de marca; no usar `MugiwaraCrest` ni `mugiwaraSlug` en cabeceras generales
- `actions`
- `breadcrumbs?`
- puede usar un heading editorial visible distinto del nombre canónico de ruta si la spec lo permite (ej. `Dashboard` -> `Estado del barco`)
- en responsive, apilar bloque principal y acciones; pills y metadatos deben envolver sin cortar el contenido

## 5.2 Foundation
### `SurfaceCard`
Card base con variantes:
- default
- elevated
- interactive
- accented
- títulos largos, `code` y bloques densos deben degradar bien en widths estrechos

### `StatusBadge`
Props:
- `status: 'operativo' | 'revision' | 'incidencia' | 'stale' | 'sin-datos'`

### `StatePanel`
Shared panel for empty, fallback, degraded, informational and priority states.

Accessibility contract:
- Default semantics are intentionally quiet: no ARIA live role is emitted unless the caller opts in.
- Static empty/fallback/explanatory panels should keep the default quiet semantics.
- Use `ariaRole="status"` only for genuinely dynamic status updates that benefit from polite announcement.
- Use `ariaRole="alert"` only for urgent incidents or action-required panels that should be announced assertively.
- Use `ariaRole="region"` or `ariaRole="group"` with `ariaLabel` for named landmark/grouping semantics without live-region noise.
- `StatePanel` visual status and accessible announcement semantics are separate decisions.

### `MetricCard`
Props:
- `label`
- `value`
- `meta?`
- `icon?`

### `SystemSignalsPanel`
- bloque compacto de estado por subsistema
- pensado para dashboard y reusable en healthcheck

### `IncidentsPanel`
- lista corta de incidencias recientes
- prioridad visual a cambios recientes o críticos

### `SecurityPrinciplesStrip`
- callout horizontal reutilizable
- mensajes cortos de perímetro y seguridad
- uso opcional en dashboard o healthcheck

### `EmptyState`
### `ErrorState`
### `StaleBanner`
### `FilterBar`
### `TabGroup`

## 5.3 Mugiwara identity
### `MugiwaraCrest`
Responsabilidades:
- renderizar la calavera del agente
- soportar tamaño pequeño/medio
- soportar variante neutra o con acento

Props sugeridas:
- `slug`
- `size?: 'sm' | 'md' | 'lg'`
- `decorative?: boolean`
- `accent?: boolean`

### `MugiwaraCard`
Props sugeridas:
- `slug`
- `name`
- `role`
- `status`
- `signals`
- `href?`

Implementación recomendada:
- mantener estructura fija de card
- usar color + crest para identidad
- si se muestran `tono`, `especialidad` o `carga`, condensarlos como signals cortas; no convertir la card en perfil largo

### `MugiwaraInlineChip`
- calavera pequeña + nombre + color

---

# 6. Handoff de assets: dónde dejar las imágenes

## 6.1 Recomendación principal
Las calaveras deben guardarse como **assets estáticos del frontend** dentro de `apps/web/public/`.

## 6.2 Ruta recomendada
```text
apps/web/public/assets/mugiwaras/crests/
  luffy.svg
  zoro.svg
  nami.svg
  usopp.svg
  sanji.svg
  chopper.svg
  robin.svg
  franky.svg
  brook.svg
```

## 6.3 Si necesitas variantes
```text
apps/web/public/assets/mugiwaras/crests/
  luffy.svg
  luffy-mark.svg
  zoro.svg
  nami.svg
  ...
```

### Convención
- `<slug>.svg` = versión principal para cards y headers
- `<slug>-mark.svg` = variante simplificada si hace falta para chips o tamaños muy pequeños

## 6.4 Formato recomendado
### Prioridad 1: SVG
Usar **SVG** siempre que se pueda.

**Por qué:**
- escala perfecta
- pesa menos
- se ve mejor en UI pequeña
- permite tintado o adaptación si el archivo está bien construido

### Evitar como formato principal
- JPG para emblemas
- PNG grande con fondo innecesario
- capturas recortadas de fanart sin limpiar

## 6.5 Especificación de asset para cada calavera
Cada archivo idealmente debe:
- tener fondo transparente
- estar limpio y centrado
- no incluir ruido del fondo original
- tener margen de seguridad interno
- verse bien entre 20px y 64px

## 6.6 Si aún no tienes SVG
Plan B aceptable:
```text
apps/web/public/assets/mugiwaras/crests-png/
  luffy.png
  zoro.png
  ...
```

Pero la recomendación sigue siendo migrar luego a SVG.

---

# 7. ¿Necesitas más imágenes además de las calaveras?

## 7.1 Imprescindibles para el MVP
### Sí o sí
- **las 9 calaveras/emblemas de Mugiwara**

Con eso ya se puede construir una interfaz muy buena.

## 7.2 Assets de marca privados/locales
### A. Emblema y favicon `laya-mugiwara`
Rutas privadas/locales esperadas:
```text
apps/web/public/assets/brand/
  laya-mugiwara.svg
  laya-mugiwara.jpg
```

Sirve para:
- favicon/app icon: `laya-mugiwara.svg`
- emblema de `PageHeader` y títulos generales: `laya-mugiwara.jpg`

Política de empaquetado:
- `apps/web/public/assets/brand/` permanece ignorado en `.gitignore`.
- No versionar ni forzar `git add -f` de estos assets en el repo público salvo orden explícita de Pablo.
- El despliegue privado debe mantener esos dos ficheros presentes localmente.
- Las crests de Mugiwara siguen en `assets/mugiwaras/crests*` para cards/selectores/contextos de agente.

### B. Favicon / app icon
Si en el futuro se decide publicar un fallback público, debe ser una decisión explícita. La implementación actual usa metadata de Next apuntando al SVG privado/local:
```text
apps/web/public/assets/brand/laya-mugiwara.svg
```

### C. Textura o fondo muy sutil opcional
Solo si está muy controlado.
Ruta sugerida:
```text
apps/web/public/assets/backgrounds/
  nautical-grid-subtle.svg
  map-texture-subtle.svg
```

**Ojo:** esto es opcional. Si no está muy fino, mejor no usarlo.

## 7.3 No necesarias para el MVP inicial
- retratos grandes de los Mugiwara
- pixel art completo
- ilustraciones hero gigantes
- posters de One Piece de fondo
- fanart recargado por pantalla

Eso metería ruido y ralentizaría la implementación.

---

# 8. Especificación de naming de assets

## 8.1 Slugs canónicos
Usar estos slugs y no improvisar otros:
- `luffy`
- `zoro`
- `nami`
- `usopp`
- `sanji`
- `chopper`
- `robin`
- `franky`
- `brook`

## 8.2 Mapa de identidad sugerido
```ts
export const mugiwaraMeta = {
  luffy: {
    name: 'Luffy',
    role: 'Capitán / coordinación',
    crestSrc: '/assets/mugiwaras/crests/luffy.svg',
  },
  zoro: {
    name: 'Zoro',
    role: 'Software / implementación',
    crestSrc: '/assets/mugiwaras/crests/zoro.svg',
  },
  nami: {
    name: 'Nami',
    role: 'Finanzas / control',
    crestSrc: '/assets/mugiwaras/crests/nami.svg',
  },
  usopp: {
    name: 'Usopp',
    role: 'Marca, narrativa y conversión',
    crestSrc: '/assets/mugiwaras/crests/usopp.svg',
  },
  sanji: {
    name: 'Sanji',
    role: 'Operación premium / experiencia',
    crestSrc: '/assets/mugiwaras/crests/sanji.svg',
  },
  chopper: {
    name: 'Chopper',
    role: 'Soporte / cuidado',
    crestSrc: '/assets/mugiwaras/crests/chopper.svg',
  },
  robin: {
    name: 'Robin',
    role: 'Research / conocimiento',
    crestSrc: '/assets/mugiwaras/crests/robin.svg',
  },
  franky: {
    name: 'Franky',
    role: 'Infraestructura / automatización',
    crestSrc: '/assets/mugiwaras/crests/franky.svg',
  },
  brook: {
    name: 'Brook',
    role: 'Señalización / capa expresiva',
    crestSrc: '/assets/mugiwaras/crests/brook.svg',
  },
} as const
```

Los roles exactos pueden ajustarse al canon del proyecto, pero el slug + crest path deben mantenerse constantes.

---

# 9. Handoff por pantalla para implementar primero

## 9.1 Dashboard
### Entregar
- layout dashboard
- 4 `MetricCard`
- bloque `Tripulación activa`
- accesos rápidos
- lista de señales recientes
- `SystemSignalsPanel`
- `IncidentsPanel`
- `SecurityPrinciplesStrip` opcional si no rompe densidad

### Componentes mínimos
- `PageHeader`
- `MetricCard`
- `MugiwaraCard`
- `QuickAccessCard`
- `RecentSignalsList`
- `SystemSignalsPanel`
- `IncidentsPanel`

## 9.2 Mugiwaras
### Entregar
- `FilterBar`
- grid responsive de `MugiwaraCard`
- detalle básico por drawer/modal/ruta
- heading editorial `Tripulación activa` si ayuda a la narrativa, manteniendo la ruta/módulo `mugiwaras`

## 9.3 Skills
### Entregar
- layout dos columnas
- listado filtrable
- detalle de skill
- affordances de edición visibles solo si aplica
- badge `Editable` inequívoco y principio de `edición controlada` dentro de la propia pantalla

## 9.4 Skills save
### Entregar
- campo de actor visible en la UI
- envío real a `PUT /api/v1/skills/{skill_id}`
- gestión de conflicto `stale` por fingerprint
- feedback final de operación (`success` / `rejected` / `failed`)
- cierre del flujo de edición permitida sin abrir escritura libre

## 9.5 Memory
### Entregar
- selector de Mugiwara
- tabs `Built-in` / `Honcho`
- panel de estado de fuente
- panel de contenido
- badge o callout `Solo lectura`
- copy de `memoria operativa` para reforzar la separación respecto a `vault`

## 9.6 Vault
### Entregar
- layout índice / documento / metadatos
- breadcrumbs
- render markdown legible
- callout o framing de `canon curado`
- contraste visual suficiente frente a `memory`

## 9.7 Healthcheck
### Entregar
- summary bar
- grid de módulos
- tabla/lista de eventos
- `SystemSignalsPanel` o equivalente si aporta claridad
- `IncidentsPanel` o framing de incidencias recientes
- `SecurityPrinciplesStrip` opcional si el perímetro necesita contexto

---

# 10. Decisiones UX concretas a respetar

## 10.1 Dashboard es la home
No abrir con una landing extra. Si `/` existe como ruta separada, debe redirigir o comportarse como entrada al dashboard.

## 10.2 `memory` no es `vault`
Deben sentirse distintas:
- `memory`: operativa, por fuente, por agente
- `vault`: documental, navegable, editorial

## 10.3 `skills` no debe parecer lectura pura
Tiene que comunicar que ahí sí existe edición controlada.

## 10.4 La identidad temática vive en detalles
- crest
- acentos cromáticos
- labels
- pequeños guiños verbales

No en fondos gigantes ni exceso de fanart.

---

# 11. Checklist de assets que debes pedir/reunir

## Necesarios ahora
- [ ] `luffy.svg`
- [ ] `zoro.svg`
- [ ] `nami.svg`
- [ ] `usopp.svg`
- [ ] `sanji.svg`
- [ ] `chopper.svg`
- [ ] `robin.svg`
- [ ] `franky.svg`
- [ ] `brook.svg`

## Recomendados después
- [ ] logo del producto
- [ ] mark simplificada del producto
- [ ] favicon
- [ ] textura sutil opcional

---

# 12. Entrega mínima buena para empezar a picar código
Zoro puede empezar bien si tiene ya:
1. `docs/frontend-ui-spec.md`
2. este `docs/frontend-implementation-handoff.md`
3. las 9 calaveras en `apps/web/public/assets/mugiwaras/crests/`

Con eso ya hay base real para implementar el shell completo del MVP sin improvisar dirección de diseño.

---

# 13. Decisión final
La implementación frontend debe seguir esta fórmula:

**shell operativo claro + diseño dark premium + identidad Mugiwara basada en calaveras y acentos por agente.**

Si hay conflicto entre fantasía y claridad, gana la claridad.

---

# 14. Siguiente bloque recomendado tras 10.x
Con 10.x cerrado, el siguiente bloque recomendado es **quality/accessibility hardening** en microfases pequeñas:

## 11.1 Focus and keyboard states
- focus visible consistente
- navegación por teclado sin affordance perdida
- contraste suficiente en controles interactivos

## 11.2 Contrast and semantic hierarchy
- revisar texto secundario, badges, pills y labels
- endurecer legibilidad y jerarquía visual
- mantener tono dark premium sin lavar el contenido

## 11.3 Responsive fine-tuning
- revisar wraps, densidad y micro-overflows en móvil/tablet
- ajustar headers, cards, chips y barras densas

## 11.4 Visual verify baseline
- checklist visual canónica por rutas clave
- base repetible para futuros cierres
- comando canónico: `npm run verify:visual-baseline`

Regla del bloque:
- no abrir nuevas capacidades de producto
- no abrir nuevas superficies de escritura
- si identidad y claridad compiten, gana claridad

## Módulo frontend `git` — Issue #40.4 (`Repos Git`)
- Ruta: `apps/web/src/app/git/page.tsx`.
- Adapter: `apps/web/src/modules/git/api/git-http.ts`, siempre `server-only`, con `MUGIWARA_CONTROL_PANEL_API_URL`, `cache: 'no-store'`, validación `http(s)` y errores codificados/saneados.
- Fixture/fallback: `apps/web/src/modules/git/view-models/git-surface.fixture.ts`, sin rutas host, secretos, detalles internos de ejecución ni errores crudos.
- CSS/responsive: clases `git-*` en `globals.css` para listas/cards/diff con `min-width: 0`, wrap y scroll interno del diff.
- Seguridad de presentación: la página no lee `process.env`, no hace fetch browser, no conoce backend URL, no acepta input de paths/refs/revspecs y solo encadena `repo_id`/SHA que vienen de respuestas backend.
- Selector 40.5: `Selección controlada` repo/commit mediante enlaces server-side; `searchParams.repo_id` se acepta solo si existe en `repoIndex.repos` y `searchParams.sha` solo si existe en `commits.commits` del repo seleccionado. No hay inputs, forms, búsqueda libre ni selector de refs/rangos.
- Verificación obligatoria: `npm run verify:git-server-only`, typecheck, build, `npm run verify:visual-baseline`, `git diff --check` y smoke HTML/DOM anti-leakage.

Nota 40.4: el contenido de líneas del diff se omite en frontend; la UI muestra metadata, contadores y estados de redacción/truncado/omisión para evitar reintroducir canarios o secretos históricos en HTML/DOM. Guardrail: `npm run verify:git-server-only`.

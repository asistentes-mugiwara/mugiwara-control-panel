# UI Specification — Mugiwara Control Panel MVP

## Estado del documento
- **Owner:** Usopp
- **Audiencia principal:** Zoro / implementación frontend en `apps/web`
- **Objetivo:** convertir la dirección visual, la UX y la arquitectura del shell en una especificación implementable y estable
- **Alcance:** MVP del control plane
- **Principio rector:** control plane serio por dentro, identidad Mugiwara por fuera

---

# 1. Design brief

## 1.1 Objetivo del producto
`mugiwara-control-panel` es un control plane privado para Mugiwara/Hermes. El frontend debe priorizar:
- observabilidad
- navegación clara del sistema
- lectura rápida de estado y conocimiento
- edición controlada solo en `skills`

No es una landing de marketing ni una app de consumo. Es una interfaz operativa y documental con identidad temática.

## 1.2 Objetivo del frontend
Diseñar un shell de navegación estable y escaneable que:
- se entienda en pocos segundos
- haga visibles estados, fuentes y frescura de datos
- distinga con claridad lectura vs edición
- mantenga separación estricta entre `memory` y `vault`
- use identidad One Piece sin degradar claridad, seriedad ni mantenibilidad

## 1.3 Principios UX/UI
1. **Primero claridad, después ornamentación.**
2. **Una navegación principal estable para todo el shell.**
3. **El dashboard hace de home del producto.** No diseñar una landing separada dentro del MVP.
4. **Cada pantalla debe responder rápido:** qué veo, qué estado tiene, qué puedo abrir, qué está fallando.
5. **La identidad Mugiwara se expresa con moderación:** calaveras, acentos cromáticos, microcopy y detalles de estilo; no con sobrecarga visual.
6. **`skills` es la única superficie editable del MVP.** Todo lo demás es lectura.
7. **`vault` es un módulo/página propia.** No integrarlo dentro de `memory`.
8. **La UI representa estado; la seguridad vive en backend.**

## 1.4 Tono visual
- base: dark mode premium, operativo y legible
- capa temática: aventura náutica, tripulación, bitácora, mission control
- evitar estética de fan site, collage o interfaz infantil

## 1.5 Público de la interfaz
- operadores del sistema Mugiwara/Hermes
- agentes y humanos que necesitan leer y navegar el sistema con rapidez
- usuarios internos con contexto técnico/operativo, no público general

## 1.6 Restricciones del MVP
- no hay landing separada en la arquitectura actual del shell
- no introducir nuevas superficies de escritura fuera de `skills`
- no mezclar `memory`, `vault` y `engram` en una sola experiencia
- no esconder estados operativos detrás de interacciones complejas
- no diseñar componentes que dependan de assets gigantes o ilustraciones pesadas

---

# 2. Sitemap

## 2.1 Navegación principal confirmada
1. `dashboard`
2. `mugiwaras`
3. `skills`
4. `memory`
5. `vault`
6. `healthcheck`
7. `usage`

## 2.2 Jerarquía de rutas sugerida
```text
/
├── /dashboard
├── /mugiwaras
│   └── /mugiwaras/[slug]          # opcional en MVP si se abre detalle por ruta
├── /skills
│   ├── /skills?scope=global
│   ├── /skills?mugiwara=[slug]
│   └── /skills/[skillId]          # opcional si el detalle merece ruta
├── /memory
│   └── /memory/[slug]             # opcional o resuelto por selector/tab
├── /vault
│   └── /vault/[...path]           # navegación documental si se implementa por ruta
├── /healthcheck
└── /usage                         # Usage Codex/Hermes current-state + calendario + ventanas 5h históricas
```

## 2.3 IA del shell
### Sidebar principal
- Dashboard
- Mugiwaras
- Skills
- Memory
- Vault
- Healthcheck
- Uso

### Topbar
- identidad del producto
- métricas globales siempre visibles: RAM, disco y uptime desde snapshot server-only saneado
- búsqueda futura o comando rápido reservado
- estado global resumido
- timestamp / última actualización cuando la superficie lo aporte

### Convención de navegación
- sidebar persistente en desktop
- colapsable en tablet/mobile
- el estado activo debe ser inequívoco
- breadcrumbs solo donde aporten orientación real (`vault`, detalle de skill, detalle de mugiwara si existe)

---

# 3. Sistema visual

## 3.1 Paleta base del producto
| Token | Hex | Uso |
|---|---:|---|
| `brand-navy-900` | `#183A83` | marca principal, títulos, fondos destacados |
| `brand-blue-700` | `#2561CE` | acciones secundarias, foco, enlaces, estados activos |
| `brand-sky-500` | `#5A9DDB` | apoyo, highlights, visuales suaves |
| `brand-gold-400` | `#FFE347` | CTA primario, foco hero, acento positivo fuerte |
| `brand-red-600` | `#C94128` | acento caliente, incidencias, energía |
| `brand-brown-700` | `#503528` | editorial, acento náutico, fondos cálidos puntuales |
| `brand-pearl-100` | `#E8E8E8` | texto claro principal, fondos claros excepcionales |

## 3.2 Colores neutrales UI sugeridos
| Token | Hex |
|---|---:|
| `bg-app` | `#0B1220` |
| `bg-sidebar` | `#0E1628` |
| `bg-surface-1` | `#131D31` |
| `bg-surface-2` | `#18243D` |
| `border-subtle` | `rgba(255,255,255,0.08)` |
| `text-primary` | `#E8E8E8` |
| `text-secondary` | `#AAB4C8` |
| `text-muted` | `#7E8AA3` |

## 3.3 Estados semánticos
| Estado | Hex | Uso |
|---|---:|---|
| `state-success` | `#3FAF6B` | operativo, ok |
| `state-warning` | `#D9A441` | revisión, atención |
| `state-danger` | `#C94128` | error, incidencia |
| `state-stale` | `#C97B2E` | datos desactualizados |
| `state-neutral` | `#6C7891` | sin datos, no inicializado |

## 3.4 Colores por Mugiwara
Usar estos colores como **acento de identidad**, nunca como fondo dominante de toda la interfaz.

| Mugiwara | Color principal | Acento | Intención |
|---|---:|---:|---|
| Luffy | `#FFE347` | `#C94128` | aventura, liderazgo |
| Zoro | `#2F6B3B` | `#111111` | fuerza, disciplina |
| Nami | `#E97A2E` | `#2B63C6` | navegación, ingenio |
| Usopp | `#C79A2B` | `#3D6C3A` | inventiva, aventura |
| Sanji | `#314A63` | `#D8B55B` | precisión, elegancia |
| Chopper | `#E889B5` | `#6CB7E8` | cuidado, empatía |
| Robin | `#6D4AA8` | `#2A173E` | misterio, conocimiento |
| Franky | `#4FB7E8` | `#D84032` | potencia, mecánica |
| Brook | `#2B2138` | `#D8C34A` | teatralidad, música |

## 3.5 Uso de calaveras/emblemas
Las calaveras de cada Mugiwara sustituyen al pixel art como ancla visual principal.

### Reglas
- usar la calavera como avatar principal del agente
- tamaño pequeño o medio según contexto
- priorizar versiones monocromo o duotono con acento del personaje
- no usar calaveras gigantes como decoración de fondo
- no mezclar en la misma card calavera + pixel art + textura temática pesada

### Contextos de uso
- cards de `mugiwaras`
- selector de agente en `memory` y `skills`
- headers de detalle
- chips o badges de identidad

## 3.6 Tipografía
### Recomendación
- base UI: `Inter`, `Geist` o similar
- pesos frecuentes: 500 / 600 / 700
- evitar tipografías caricaturescas en cuerpo o navegación

### Escala sugerida
- page title: 32/40
- section title: 24/32
- card title: 18/24
- body: 14/20 o 16/24
- caption/metadata: 12/16

## 3.7 Estilo general
- dark mode por defecto
- cards con radio medio
- sombras cortas y sobrias
- bordes suaves y constantes
- iconografía limpia
- grid clara y espaciado generoso
- detalles temáticos mínimos: mapa, bitácora, cubierta, navegación

## 3.7.1 Semántica accesible de estados
- Los paneles de estado compartidos deben separar tono visual de semántica ARIA.
- Los estados vacíos, fallback, snapshot o informativos son contenido estático por defecto y no deben anunciarse todos como live regions.
- Las actualizaciones dinámicas pueden usar semántica `status` con anuncio polite cuando haya beneficio claro.
- Las incidencias urgentes o bloques de acción requerida pueden usar `alert` de forma explícita y acotada.
- Si un panel necesita nombre accesible sin anunciarse como live region, usar `region`/`group` con etiqueta explícita.

## 3.8 Ideas rescatadas de exploración visual de landing
Se revisó una propuesta de landing temática para `Mugiwara Control Panel`. **No debe tomarse como arquitectura del shell**, pero sí deja hallazgos visuales y narrativos útiles para estas 6 páginas.

### Qué se rescata
- base `dark premium` con navy profundo, gris azulado y acentos oro/azul
- textura náutica muy sutil en fondos, sin competir con la información
- uso de `Estado del barco` como heading editorial del dashboard
- bloque de `Tripulación activa` como patrón de navegación/resumen
- paneles de `Señales del sistema` e `Incidencias recientes` dentro del dashboard
- callouts de seguridad tipo `Código público. Operación privada`
- diferenciación visual clara entre producto operativo, arquitectura y seguridad

### Qué NO se rescata tal cual
- una landing pública separada dentro del MVP del shell
- naming alternativo que sustituya a los 6 módulos canónicos
- exceso de protagonismo de personajes canon como sustituto de la estructura operativa
- `Escritura controlada` como módulo principal; debe vivir como regla transversal y affordance de `skills`
- cards de tripulación tipo póster o demasiado ilustradas

### Regla de traducción
Cuando una idea de la landing compita con claridad, navegación estable o separación de módulos, **gana la estructura del shell**.

---

# 4. Component inventory

## 4.1 Shell
### `AppShell`
Contiene layout principal.
- sidebar fija/collapsible
- topbar persistente
- área de contenido con ancho máximo

### `SidebarNav`
- lista de páginas principales
- icono + label
- estado activo inequívoco

### `Topbar`
- identidad del producto
- timestamp / última actualización
- placeholder para búsqueda/comando
- estado global resumido
- en anchos estrechos puede envolver y priorizar identidad + estado antes que chips secundarios

### `PageHeader`
- título
- subtítulo
- emblema visual general del panel con `apps/web/public/assets/brand/laya-mugiwara.jpg`
- acciones contextuales si aplican
- opcional: breadcrumbs
- en tablet/mobile debe apilar cuerpo y acciones sin provocar overflow; pills y badges deben poder envolver
- las calaveras de cada Mugiwara quedan reservadas para `/mugiwaras` y contextos donde el agente concreto sea el contenido, no para cabeceras generales

## 4.2 Foundation components
### `SurfaceCard`
Card base para métricas, fichas y módulos.
Props sugeridas:
- `elevated?: boolean`
- `interactive?: boolean`
- `accentColor?: string`
- `status?: semantic`
- títulos, metadatos y bloques `code/pre` deben romper con dignidad en anchos estrechos

### `StatusBadge`
Estados universales.
Valores mínimos:
- operativo
- revisión
- incidencia
- stale
- sin datos

### `MetricCard`
- número principal
- label
- microtexto/timestamp
- icono opcional

### `SectionBlock`
Agrupa contenido con título, descripción breve y body.

### `EmptyState`
- icono
- titular
- descripción
- CTA opcional

### `ErrorState`
- semántico
- no exponer detalles sensibles del host
- acción de reintento si existe

### `StaleBanner`
- aviso de desactualización con timestamp

### `FilterBar`
- búsqueda
- filtros por agente / categoría / estado
- chips

### `TabGroup`
Para alternar subfuentes o vistas (`built-in` / `Honcho`, etc.)

## 4.3 Componentes Mugiwara
### `MugiwaraCard`
Props mínimas:
- `name`
- `role`
- `slug`
- `crest`
- `accentColor`
- `status`
- `meta[]`

Estructura:
- línea superior color agente
- calavera
- nombre
- rol
- hasta 3 señales
- CTA o affordance de apertura

### `MugiwaraInlineChip`
- calavera pequeña
- color del agente
- nombre

### `MugiwaraStatRow`
Fila para signals dentro de cards/detalle.

## 4.4 Dashboard
### `SystemOverviewGrid`
Grid de KPIs principales.

### `QuickAccessCard`
Card de navegación a módulos.

### `RecentSignalsList`
Lista compacta de últimas señales o cambios.

### `SystemSignalsPanel`
- API, memoria, vault, jobs y otras fuentes críticas
- estado resumido + semáforo + timestamp

### `IncidentsPanel`
- incidencias recientes
- prioridad visual a lo nuevo o problemático
- no convertirlo en log infinito

## 4.5 Skills
### `SkillsListPanel`
- listado navegable
- agrupación por scope/categoría/agente
- búsqueda

### `SkillListItem`
- nombre
- scope
- editable / read-only
- Mugiwara asociado

### `SkillDetailPanel`
- título
- descripción
- metadatos
- contenido
- acciones permitidas

### `SkillEditActions`
- editar
- cancelar
- guardar
- validación visual de permisos

### Estado raíz no configurado
- Si Skills no está conectado al backend (`not_configured`) o la fuente real falla antes de cargar catálogo, la vista prioriza un único panel superior de `Acción requerida`.
- Ese panel explica qué falta, qué queda bloqueado y qué se mantiene seguro; los códigos técnicos quedan como detalle secundario o desaparecen de la explicación principal.
- El workspace no debe pedir “Selecciona una skill” cuando el catálogo no está disponible.
- Catálogo, editor y preview/auditoría pueden conservar su hueco estructural, pero con copy secundario y sin repetir la misma causa raíz.
- Las tarjetas de frontera BFF, edición allowlisted y auditoría permanecen visibles como contexto de seguridad, no como llamada principal a la acción.

## 4.6 Memory
### `MemorySourceTabs`
- Built-in
- Honcho

### `MemorySummaryCard`
- agente
- estado de fuente
- última actualización
- disponibilidad

### `MemoryContentPanel`
- texto estructurado o facts resumidos
- lectura cómoda

### `SourceStatusPanel`
- initialized / unavailable / stale / error

### `ReadOnlyBadge`
- badge o leyenda explícita de solo lectura
- útil para reforzar que `memory` no es superficie editable

## 4.7 Vault
### `VaultTree`
- índice o árbol navegable
- secciones plegables

### `VaultDocumentView`
- render markdown
- lectura cómoda
- headings claros

### `DocumentMetaPanel`
- path
- updated at
- TOC
- contexto adicional si existe

### `CanonCallout`
- callout editorial opcional para remarcar que `vault` es canon curado, no memoria operativa
- usarlo solo en header o empty states, no repetido en cada documento

## 4.8 Healthcheck
### `HealthSummaryBar`
- estado general
- número de checks
- warnings
- incidencias

### `HealthModuleCard`
- módulo: cronjobs, backups, gateways, honcho, docker, system
- estado
- timestamp
- resumen

### `HealthEventsTable`
- fuente
- estado
- timestamp
- detalle resumido

### `SecurityPrinciplesStrip`
- patrón reutilizable para dashboard o healthcheck
- mensajes tipo: `Repo público`, `Deny by default`, `Allowlists explícitas`, `Sin acceso arbitrario al host`
- no debe sustituir datos operativos; funciona como recordatorio de perímetro

---

# 5. Wireframe ultra estructurado por pantalla

## 5.1 Shell global
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR                                                                    │
│ Mugiwara Control Panel | última actualización | estado global | búsqueda  │
├──────────────────┬─────────────────────────────────────────────────────────┤
│ SIDEBAR          │ MAIN                                                   │
│                  │                                                         │
│ Dashboard        │ [PageHeader]                                            │
│ Mugiwaras        │ título                                                  │
│ Skills           │ subtítulo                                               │
│ Memory           │ acciones opcionales / breadcrumbs                       │
│ Vault            │                                                         │
│ Healthcheck      │ [Page body by route]                                    │
│                  │                                                         │
│ mini estado      │                                                         │
│ build/version    │                                                         │
└──────────────────┴─────────────────────────────────────────────────────────┘
```

### Comportamiento
- sidebar fija en desktop
- sidebar colapsable en tablet
- topbar siempre visible o sticky
- área main con `max-width` consistente

---

## 5.2 Dashboard
### Objetivo
Home operativa del shell.

### Estructura
```text
[PageHeader]
Título: Estado del barco
Subtítulo: Visión general del sistema Mugiwara/Hermes

[Row 1: KPIs]
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ sistema    │ │ mugiwaras  │ │ skills     │ │ health     │
│ general    │ │ activos    │ │ totales    │ │ status     │
└────────────┘ └────────────┘ └────────────┘ └────────────┘

[Row 2: Tripulación activa]
┌──────────────────────────────────────────────────────────────────────────┐
│ fichas compactas de Mugiwara                                            │
│ Luffy | Zoro | Nami | Usopp | ...                                       │
└──────────────────────────────────────────────────────────────────────────┘

[Row 3: Accesos rápidos]
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Skills     │ │ Memory     │ │ Vault      │ │ Healthcheck│
└────────────┘ └────────────┘ └────────────┘ └────────────┘

[Row 4: Señales del sistema + incidencias recientes]
┌──────────────────────────────┬──────────────────────────────────────────┐
│ señales del sistema          │ incidencias recientes                    │
│ API                          │ memoria Zoro alta                        │
│ jobs                         │ warning base de datos                    │
│ memoria                      │ job retrasado                            │
│ vault                        │ ...                                      │
└──────────────────────────────┴──────────────────────────────────────────┘

[Row 5: Security strip opcional]
┌──────────────────────────────────────────────────────────────────────────┐
│ Código público. Operación privada. Repo público · deny by default · ... │
└──────────────────────────────────────────────────────────────────────────┘
```

### Reglas visuales
- hero interno corto; no convertirlo en landing de marketing
- los KPI deben priorizar contraste y scannability
- `Tripulación activa` es un bloque de navegación y reconocimiento, no un mural decorativo
- usar `Estado del barco` como heading visible de página si mejora la narrativa, manteniendo `Dashboard` como nombre de módulo/ruta
- el bloque de señales del sistema debe ser compacto y legible, no una tabla densa

### Estados
- si falta una fuente parcial, no bloquear toda la pantalla
- usar `StaleBanner` si health o system están desactualizados

---

## 5.3 Mugiwaras
### Objetivo
Vista principal de agentes activos.

### Estructura
```text
[PageHeader]
Título: Tripulación activa
Subtítulo: Estado, identidad y señales de cada Mugiwara

[FilterBar]
- todos
- activos
- con incidencias
- por rol
- búsqueda

[Grid de MugiwaraCard]
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ MugiwaraCard │ │ MugiwaraCard │ │ MugiwaraCard │
└──────────────┘ └──────────────┘ └──────────────┘

[Opcional: Detail region]
- modal / drawer / ruta propia `/mugiwaras/[slug]`
```

### Anatomía de `MugiwaraCard`
```text
┌──────────────────────────────┐
│ acento superior              │
│ [calavera]     [badge estado]│
│ Nombre                       │
│ Rol                          │
│                              │
│ señal 1                      │
│ señal 2                      │
│ señal 3                      │
│                              │
│ abrir ficha →                │
└──────────────────────────────┘
```

### Reglas
- misma estructura para todos los agentes
- variación solo por color, calavera y texto
- no usar fondos completos del color del personaje
- reutilizar de la exploración landing el patrón `rol + tono + especialidad + carga/estado`, pero reducido a signals breves y escaneables

### Contenido mínimo por ficha
- nombre
- rol
- estado operativo
- skills relacionadas o count
- built-in / memoria resumida / última señal según disponibilidad

### Nota de tono
- la página puede usar el heading editorial `Tripulación activa`
- el nombre canónico del módulo debe seguir siendo `Mugiwaras`
- evitar convertir cada card en una lámina de personaje

---

## 5.4 Skills
### Objetivo
Catálogo de skills y única superficie editable.

### Estructura
```text
[PageHeader]
Título: Skills
Subtítulo: Catálogo global y por Mugiwara con edición controlada

[FilterBar]
- búsqueda
- scope: global / por Mugiwara
- categoría
- editable / read-only

[Two-panel layout]
┌──────────────────────────────┬────────────────────────────────────────────┐
│ listado                      │ detalle                                     │
│                              │                                             │
│ SkillListItem               │ nombre                                       │
│ SkillListItem               │ descripción                                  │
│ SkillListItem               │ tags / scope / Mugiwara                      │
│ ...                         │ contenido                                    │
│                             │ acciones permitidas                          │
└──────────────────────────────┴────────────────────────────────────────────┘
```

### Reglas
- esta pantalla debe sentirse editorial y productiva
- el detalle debe respirar y ser legible
- la edición no puede parecer disponible si backend no la autoriza
- los affordances de edición deben ser inequívocos
- rescatar de la landing la idea de `edición controlada`, pero tratarla como principio de interfaz dentro de `skills`, no como módulo paralelo

### Contenido mínimo
- listado global
- listado filtrable por Mugiwara
- detalle de skill
- estado editable/lectura

### Refuerzo visual obligatorio
- badge `Editable` solo en `skills`
- badges o labels `Read only` en módulos no editables cuando aporte claridad

### Estados
- `empty`: sin skills para el filtro
- `error`: fallo de listado o detalle
- `ready`: lectura y edición controlada

---

## 5.5 Memory
### Objetivo
Memoria operativa por agente. No documentación.

### Estructura
```text
[PageHeader]
Título: Memory
Subtítulo: Built-in por Mugiwara y estado resumido de Honcho

[Top controls]
- selector de Mugiwara
- tabs: Built-in / Honcho
- estado de fuente

[Main layout]
┌──────────────────────────────┬────────────────────────────────────────────┐
│ Summary / source status      │ contenido                                   │
│                              │                                             │
│ Mugiwara seleccionado        │ facts / memory blocks                       │
│ última actualización         │                                             │
│ initialized/stale/error      │                                             │
└──────────────────────────────┴────────────────────────────────────────────┘
```

### Reglas
- dejar explícito visualmente que `Vault` no forma parte de esta página
- distinguir fuente no disponible vs sin datos vs sin permiso
- usar acento cromático del Mugiwara seleccionado solo en detalles
- rescatar de la landing la idea de `memoria operativa`, pero reforzando más que aquí no vive documentación canónica

### Contenido mínimo
- built-in por Mugiwara
- Honcho resumido / facts
- estado de fuente
- timestamps

### Patrón recomendado
- encabezado con descriptor tipo `Memoria operativa por agente`
- badge o callout `Solo lectura`
- iconografía viva/dinámica frente a la más documental de `vault`

---

## 5.6 Vault
### Objetivo
Lector/navegador documental independiente.

### Estructura
```text
[PageHeader]
Título: Vault
Subtítulo: Navegación y lectura del canon curado

[Search + breadcrumbs]
- búsqueda
- ruta actual

[Three-panel layout]
┌──────────────────┬────────────────────────────────┬─────────────────────┐
│ árbol / índice   │ documento                      │ metadatos / TOC     │
│                  │                                │                     │
│ secciones        │ markdown renderizado           │ path                │
│ carpetas         │ headings                       │ updated at          │
│ documentos       │ bloques                        │ índice interno      │
└──────────────────┴────────────────────────────────┴─────────────────────┘
```

### Reglas
- experiencia editorial y documental
- lectura cómoda y jerarquía clara
- breadcrumbs obligatorios si hay navegación profunda
- no reutilizar la misma UI que `memory`
- rescatar de la landing la lógica de `canon curado`, pero con un framing más documental que heroico

### Estilo
- más calmado, más editorial
- puede introducir acentos `brand-brown-700` y `brand-navy-900`

### Patrón recomendado
- subtítulo tipo `Canon curado y navegación documental`
- callout opcional diferenciando `vault` vs `memory`
- TOC o meta panel visibles para reforzar lectura estructurada

---

## 5.7 Healthcheck
### Objetivo
Salud operativa del sistema.

### Estructura
```text
[PageHeader]
Título: Healthcheck
Subtítulo: Señales operativas del sistema en lectura

[Summary bar]
- estado general
- checks ok
- warnings
- incidencias

[Module grid]
┌────────────┐ ┌────────────┐ ┌────────────┐
│ cronjobs   │ │ backups    │ │ gateways   │
└────────────┘ └────────────┘ └────────────┘
┌────────────┐ ┌────────────┐ ┌────────────┐
│ honcho     │ │ docker     │ │ system     │
└────────────┘ └────────────┘ └────────────┘

[Events table/list]
- timestamp
- fuente
- estado
- detalle resumido
```

### Reglas
- usar semántica clara de estado
- `stale` debe verse distinto a `error`
- timestamp visible siempre
- no sobrecargar con densidad innecesaria
- rescatar de la landing el patrón de `señales del sistema` + `incidencias recientes`

### Microcopy temático permitido
- Señales de cubierta
- Revisión pendiente
- Fuente sin respuesta

Sin renombrar conceptos técnicos principales.

### Patrón recomendado
- summary bar arriba
- grid de checks por subsistema en medio
- lista/tabla de incidencias recientes abajo
- franja opcional de principios de seguridad si ayuda a contextualizar el perímetro

---

# 6. Responsive behavior

## 6.1 Desktop
- sidebar fija
- grids de 3 o 4 columnas según módulo
- `max-width` recomendado: `1280px` a `1440px`

## 6.2 Tablet
- sidebar colapsable
- grids de 2 columnas
- paneles laterales pueden pasar a stacked layout
- `memory`, `skills`, `healthcheck` y `vault` deben poder bajar paneles auxiliares debajo del contenido principal

## 6.3 Mobile
- prioridad absoluta a lectura
- navegación compacta
- cards en una columna
- tablas convertidas en bloques o listas resumidas
- evitar layouts de tres columnas en `vault`
- `PageHeader`, topbar, badges y chips deben envolver sin micro-overflows

---

# 7. Estados UX por módulo

## Dashboard
- `loading`: skeleton de KPIs y cards
- `error`: error parcial sin romper shell
- `stale`: banner visible si health/system caducan

## Mugiwaras
- `empty`: ningún agente visible
- `error`: fallo al cargar índice o ficha

## Skills
- `empty`: sin skills para filtro actual
- `error`: fallo en listado o detalle
- `ready`: detalle editable solo con permiso explícito

## Memory
- `empty`: memoria no inicializada
- `error`: fuente no accesible
- `stale`: datos antiguos

## Vault
- `empty`: índice o documento ausente
- `error`: navegación/lectura fallida

## Healthcheck
- `stale`: checks fuera de umbral
- `error`: fuente no disponible

---

# 8. Implementación: reglas para Zoro

## 8.1 Decisiones obligatorias
- tratar este documento como referencia de implementación para `apps/web`
- mantener la navegación del shell alineada con este sitemap
- no introducir una landing separada dentro del MVP salvo decisión explícita documentada
- no integrar `vault` dentro de `memory`
- mantener `skills` como única superficie editable

## 8.2 Traducción recomendada a código
### Organización sugerida
```text
apps/web/src/
  app/
    dashboard/
    mugiwaras/
    skills/
    memory/
    vault/
    healthcheck/
    layout.tsx
  modules/
    dashboard/
    mugiwaras/
    skills/
    memory/
    vault/
    healthcheck/
  shared/
    ui/
    layout/
    navigation/
    status/
    mugiwara/
```

### Componentes transversales a centralizar
- `AppShell`
- `SidebarNav`
- `Topbar`
- `PageHeader`
- `SurfaceCard`
- `StatusBadge`
- `EmptyState`
- `ErrorState`
- `StaleBanner`

## 8.3 Semántica de diseño
- usar tokens de color en vez de hex dispersos
- separar tokens de marca, tokens semánticos y tokens por Mugiwara
- no codificar colores arbitrarios por pantalla

## 8.4 Regla de consistencia
Cuando haya dudas entre una decisión “más temática” y una decisión “más clara”, gana la claridad.

---

# 9. Checklist de verificación UI

## Shell
- [ ] sidebar estable con 6 páginas
- [ ] topbar consistente
- [ ] dashboard como home

## Identidad
- [ ] calaveras por Mugiwara integradas
- [ ] acentos cromáticos por agente sin saturar la UI
- [ ] tono One Piece presente pero contenido

## Producto
- [ ] `skills` única zona editable
- [ ] `memory` separada de `vault`
- [ ] healthcheck con timestamps y estados claros

## UX
- [ ] estados `loading / ready / empty / error / stale`
- [ ] contrastes suficientes
- [ ] navegación legible en desktop y responsive

---

# 10. Decisión final de diseño
La dirección a implementar es:

**dashboard premium y operativo + identidad One Piece sutil + fichas de Mugiwara con calavera y color propio.**

Ese equilibrio debe mantenerse en todas las decisiones de frontend del MVP.


## Ruta `/git` — Repos Git
- Navegación principal: añadir `Repos Git` como superficie read-only de Zoro.
- Propósito: consultar repositorios Git allowlisteados desde backend, historial reciente, ramas locales, detalle de commit y diff histórico ya saneado.
- Copy obligatorio: dejar visible `Solo lectura`, `repo_id/SHA backend-owned`, `Selección controlada`, `Solo repos allowlisteados`, `Solo SHAs listados por backend` y `Diff redactado/truncado/omitido`.
- Restricciones UI: sin paths cliente, sin discovery arbitrario, sin refs/rangos/revspecs, sin acciones Git y sin working-tree diff en Issue #40.4/40.5.
- Selector 40.5: repo cards y commits son enlaces server-side; `repo_id` solo se acepta si existe en `repoIndex.repos` y `sha` solo si existe en `commits.commits` del repo seleccionado. Parámetros inválidos se ignoran sin eco ni error crudo.
- Layout: cards/listas responsive, no tablas anchas; el panel de diff usa scroll interno/controlado y `pre` con wrap para evitar overflow horizontal.
- Estados: API real, fallback local saneado, fuente no configurada/degradada; nunca mostrar backend URL, rutas host, detalles internos de ejecución y errores crudos ni errores crudos.
- Guardrail: `npm run verify:git-server-only`.

Nota 40.4: el contenido de líneas del diff se omite en frontend; la UI muestra metadata, contadores y estados de redacción/truncado/omisión para evitar reintroducir canarios o secretos históricos en HTML/DOM. Guardrail: `npm run verify:git-server-only`.

# 🕹️ Mugiwara Control Panel

> El puente de mando privado de Mugiwara/Hermes: una consola para mirar el barco, leer sus señales y navegar el sistema sin abrir la sala de máquinas.

`mugiwara-control-panel` es el **control plane privado** de Mugiwara/Hermes. Este repositorio ofrece código público saneado; su operación, configuración, datos y acceso permanecen privados.

**Para revisar el diseño:** empieza por la [revisión visual](#revisión-visual), con dos recorridos que puedes seguir sin acceder a la consola privada.

La idea es sencilla: cuando una tripulación de agentes crece, no basta con tener buenos perfiles. Hace falta una consola que responda rápido a tres preguntas:

1. **qué está pasando** en el sistema,
2. **dónde vive cada capa** —skills, memoria, vault, repos, healthchecks—,
3. **qué se puede tocar y qué solo se puede mirar**.

Aquí mandan dos reglas: claridad de puente de mando y prudencia de bodega cerrada. ⚓

## ✨ Qué aporta

- **Inicio navegable** como portada privada del producto, sin duplicar métricas ni estados propietarios.
- **Fichas Mugiwara** para ver roles, responsabilidades y señales saneadas de la tripulación.
- **Catálogo de skills** con lectura, auditoría y edición controlada solo donde toca.
- **Memory** como lectura separada de memoria operativa, sin mezclarla con canon documental.
- **Vault** como navegación del conocimiento curado.
- **Healthcheck** para observar señales de sistema sin publicar logs crudos.
- **Repos Git** en modo seguro: repos allowlisteados, historial y diffs saneados.
- **Uso** para representar consumo agregado sin convertir métricas privadas en espectáculo público.

## 🧭 Principio editorial y de producto

Este panel no quiere parecer una demo de juguete ni una cabina de avión ilegible.

Quiere sentirse como:

- **mission control privado**, porque ayuda a operar;
- **bitácora navegable**, porque ordena conocimiento;
- **interfaz Mugiwara**, porque tiene carácter sin perder seriedad;
- **producto seguro por defecto**, porque no todo lo útil debe ser publicable.

La UI enseña estados y rutas de lectura. La seguridad vive detrás: backend, allowlists, saneado, server-only y deny-by-default.

## Revisión visual

Estos recorridos describen el diseño documentado. Sirven para revisar la navegación, la jerarquía y los estados de la interfaz; no muestran datos reales ni acreditan el funcionamiento del panel.

1. **Inicio → Mugiwaras: entender quién hace qué.** En el esquema de Inicio, busca el acceso a la tripulación entre las tarjetas de navegación. En el diseño de las fichas, fíjate en cómo se separan nombre, rol y estado: el rol explica la responsabilidad; el estado no define el rol. Si no hay fichas visibles, el contrato de estados de Mugiwaras distingue una lista vacía de un fallo de carga.
2. **Inicio → Healthcheck: distinguir qué requiere atención.** Desde la tarjeta de Healthcheck, el diseño de la vista lleva del resumen a las comprobaciones y después a la bitácora. El contrato de estados de Healthcheck separa el estado actual, su causa y los eventos históricos. La pregunta clave: ¿se distingue un dato desactualizado de una fuente no disponible, sin confundir un evento pasado con una incidencia activa?

## 🧱 Arquitectura en corto

- **Frontend:** Next.js
- **Backend:** FastAPI
- **Acceso remoto previsto:** Tailscale / perímetro privado
- **Arquitectura:** monolito modular con separación por apps y paquetes
- **Frontera de seguridad:** backend server-only, allowlists explícitas y salidas saneadas

```text
apps/
├── web      # shell Next.js y experiencia de control plane
└── api      # frontera backend y adaptadores seguros

packages/
├── contracts
└── ui

docs/        # documentación viva del producto
openspec/    # specs y fases de evolución
```

## 🔐 Reglas de seguridad del repo

Este repositorio está pensado para exposición pública, así que la disciplina no es decoración:

- revisar `.gitignore` en cada cambio relevante;
- no subir secretos, `.env`, credenciales, logs sensibles ni artefactos locales;
- no publicar datos reales de healthchecks, memoria, uso, vault o runtime;
- mantener `AGENTS.md`, `docs/` y README alineados con el estado real;
- preferir capturas revisadas antes que screenshots improvisados del entorno privado.

Regla de cubierta:

> si una pieza mejora la comprensión sin aumentar la exposición, puede subir; si revela más de lo que explica, se queda fuera.

## 🧪 Scripts útiles

```bash
npm run dev:web
npm run build:web
npm run typecheck:web
npm run verify:memory-server-only
npm run verify:mugiwaras-server-only
npm run verify:skills-server-only
npm run verify:vault-server-only
npm run verify:health-dashboard-server-only
npm run verify:git-server-only
npm run verify:usage-server-only
```

## ⚙️ Configuración runtime

Ver [`docs/runtime-config.md`](docs/runtime-config.md).

Resumen documental:

- `/`, `/memory`, `/mugiwaras`, `/skills`, `/vault`, `/healthcheck`, `/usage` y `/git` dependen de fuentes server-only o BFF seguro donde aplica; `/dashboard` redirige a `/`.
- `/skills` expone al navegador solo endpoints BFF same-origin bajo `/api/control-panel/skills/**`; la URL real del backend no entra en el bundle cliente.
- Las pantallas con fallback lo declaran como fallback: nada de telemetría mágica, nada de fingir tiempo real.

## 🔗 Proyecto hermano

El perfil y el escaparate arquitectónico del sistema Mugiwara/Hermes están en:

- [`asistentes-mugiwara`](https://github.com/asistentes-mugiwara) — perfil público del ecosistema
- [`mugiwara-no-hermes`](https://github.com/asistentes-mugiwara/mugiwara-no-hermes)
- [Caso Mugiwara en el portfolio de Pablo Laya](https://prodelaya.dev/#case-mugi)

Allí se explica el modelo público de arquitectura, memoria, gobierno y frontera entre sistema vivo y escaparate. Este repo implementa una pieza concreta de ese ecosistema: la consola privada de observabilidad y navegación.

## 🧠 OpenCode + Engram

Los flujos de software asistido y memoria técnica parten de la raíz del repositorio para conservar el contexto del proyecto.

Esta práctica mantiene alineados el trabajo, la documentación y la memoria técnica sin exponer detalles de la operación privada.

## 👑 Cierre

`mugiwara-control-panel` no intenta enseñar todas las tuberías.

Intenta enseñar algo más útil:

> una forma seria, clara y con carácter de gobernar un sistema multiagente sin convertir la operación privada en escaparate imprudente.

Buen rumbo. ⚓

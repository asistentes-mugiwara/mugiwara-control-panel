# Fase 1 - Mini-fases secuenciales

## 1. Base del control plane
Objetivo: fijar el esqueleto agente-first del monolito modular.
Alcance: raíz del repo, convenciones, mapa de módulos, seguridad documental, y reglas de uso de OpenCode/Engram.
Definition of done: existe un mapa estable de módulos y reglas operativas; la documentación base refleja el stack, la seguridad y la prioridad read-only.
Verify esperado: revisión manual de docs y `AGENTS.md` relevantes; coherencia entre `README.md`, `docs/` y `openspec/`.
Criterio de judgment-day: hay ambigüedad sobre límites de módulos, sobre la frontera backend o sobre la política de escritura permitida.

## 2. Frontera backend
Objetivo: definir FastAPI como frontera de seguridad deny-by-default.
Alcance: estructura de módulos API, contratos internos, allowlists, accesos permitidos y rutas de observabilidad/health.
Definition of done: queda claro qué puede leer el backend y qué nunca debe exponer directamente la UI.
Verify esperado: checklist de seguridad y revisión de contratos de lectura/escritura.
Criterio de judgment-day: existe riesgo de acceso arbitrario al filesystem, o dudas sobre validación/aislamiento de endpoints.

## 3. Shell frontend
Objetivo: definir Next.js como UI de lectura y navegación del sistema.
Alcance: layout, navegación principal, estados de carga/error y contratos de consumo para dashboards y fichas.
Definition of done: la UI queda descrita como superficie de lectura, sin asumir escritura salvo skills autorizadas.
Verify esperado: revisión de flujos UI contra los módulos previstos y la política read-only.
Criterio de judgment-day: la experiencia necesita una capacidad de edición fuera de skills permitidas, o hay dudas sobre separación cliente/servidor.

## 4. Contratos compartidos
Objetivo: establecer tipos y esquemas compartidos entre apps y paquetes.
Alcance: `packages/contracts`, nomenclatura de payloads, errores, estados y shape de respuestas.
Definition of done: los contratos comunes están identificados y no duplican lógica entre frontend y backend.
Verify esperado: inspección de dependencia de tipos y validación de consistencia semántica.
Criterio de judgment-day: un contrato no puede modelarse sin romper la separación por capas o aparece duplicación estructural.

## 5. Superficie de skills
Objetivo: acotar la única superficie editable del MVP.
Alcance: permisos, allowlist, edición controlada y trazabilidad de cambios de skills.
Definition of done: la ruta de edición está claramente limitada, auditable y aislada del resto del sistema.
Verify esperado: revisión de política de escritura y de las reglas de seguridad para repositorio público.
Criterio de judgment-day: la edición de skills puede extenderse a otras entidades o no hay forma clara de auditarla.

## 6. Observabilidad y lectura
Objetivo: cubrir dashboard, healthcheck, memoria, vault y fichas de Mugiwara.
Alcance: solo lectura, navegación, resumen operativo y estados visibles para agentes.
Definition of done: los módulos de observabilidad están definidos con rutas, estados y prioridades claras.
Verify esperado: checklist de cobertura funcional por módulo y revisión de que no hay writes accidentales.
Criterio de judgment-day: algún módulo mezcla lectura con escritura o depende de permisos implícitos.

## 7. Endurecimiento de entrega
Objetivo: cerrar la base para trabajo iterativo seguro.
Alcance: `.gitignore`, documentación viva, trazabilidad de decisiones y preparación para fases de implementación.
Definition of done: el repo queda listo para crecer sin exponer secretos ni artefactos locales.
Verify esperado: auditoría de ignorados, revisión de docs y confirmación de que el worktree está limpio.
Criterio de judgment-day: aparece una nueva fuente de artefactos locales, secretos o salidas temporales no cubiertas.

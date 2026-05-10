# Mejoras futuras realistas del Mugiwara Control Panel

## Estado del documento

- **Fecha:** 2026-05-10
- **Solicitante:** Pablo
- **Coordinación:** Luffy
- **Debate consultado:** Franky, Zoro y Usopp vía perfiles Mugiwara locales
- **Proyecto:** `mugiwara-control-panel`
- **Alcance:** mejoras futuras útiles, realistas y coherentes con lo que ya existe

## Punto de partida confirmado

El Control Panel ya existe como cockpit operativo privado. No se propone crear “otro dashboard” ni convertirlo en consola de servidor.

Superficies y contratos ya existentes:

- API y web del Control Panel operativas.
- `/healthcheck` ya ofrece una UI visual de estado operativo, checks, frescura, severidad, facts y enlaces saneados.
- `/api/v1/healthcheck` expone un `healthcheck.workspace` basado en seis checks saneados: `gateways`, `honcho`, `docker_runtime`, `cronjobs`, `vault_sync` y `backup`.
- `/api/v1/dashboard` agrega secciones y navegación de alto nivel.
- La documentación actual ya fija límites importantes en:
  - `docs/observability-surface.md`
  - `docs/healthcheck-source-policy.md`
  - `docs/read-models.md`
  - `docs/frontend-ui-spec.md`
- El MVP mantiene una frontera clara: **read-only salvo Skills**. El panel no debe ejecutar comandos, inspeccionar logs crudos, mostrar paths internos ni convertirse en host console.

Gaps concretos detectados:

- `system-healthcheck.py` reporta estado global `WARN` con warnings operativos reales, mientras `/api/v1/healthcheck` devuelve `overall_status=pass`, `warnings=0` e `incidents=0`.
- `/api/v1/dashboard` reporta `Mugiwaras activos=9`, pero el canon operativo/gateways actuales son `10/10`: Luffy, Zoro, Franky, Nami, Robin, Usopp, Jinbe, Sanji, Chopper y Brook.

Conclusión de partida: **la mejora útil no es añadir más panel por añadir, sino reducir drift, reforzar confianza y hacer accionables los avisos sin romper el saneamiento.**

## Principios para cualquier mejora

1. **Realidad antes que estética:** el panel debe reflejar el estado operativo útil, aunque lo haga de forma resumida y saneada.
2. **Sin consola host:** nada de comandos, restart buttons, journal, tail de logs, rutas absolutas, stdout/stderr, procesos, prompts, diffs ni secretos.
3. **Read models estables:** el frontend consume contratos backend-owned; no duplica lógica ni fuentes de verdad.
4. **Degradar explícitamente:** una fuente ausente, antigua o ilegible debe aparecer como `unknown`, `stale` o `not_configured`, nunca como `pass` silencioso.
5. **Separar criticidad:** no todo warning es una incidencia crítica. Deben distinguirse runtime roto, riesgo real, aviso operativo e higiene/mantenimiento.
6. **Útil para Pablo en segundos:** la vista debe responder rápido: “¿está todo operativo?”, “¿qué requiere atención?” y “¿quién debería mirarlo?”.

## Prioridad P0 — Reconciliar healthcheck operativo completo y panel saneado

### Problema

El sistema operativo completo puede saber que hay warnings, pero el panel visible puede seguir mostrando `PASS` absoluto. Eso crea falsa confianza y reduce el valor del Control Panel como cockpit.

### Propuesta

Añadir una capa de **advisories operativos saneados** que conecte el estado de `system-healthcheck.py` con `/api/v1/healthcheck` sin exponer detalles crudos.

Los seis checks críticos actuales pueden seguir existiendo como checks principales. La mejora consiste en añadir una capa complementaria para avisos operativos allowlisted.

Campos sugeridos:

- `advisory_id` o `check_code` allowlisted.
- `status`: `info`, `warn`, `fail` o vocabulario equivalente ya usado por Healthcheck.
- `severity`: `low`, `medium`, `high`, `critical`.
- `public_summary`: resumen corto y seguro.
- `freshness` / `observed_at`.
- `impact_scope`: sistema, agente, docs, skills, cronjobs, backup, vault, gateway, etc.
- `suggested_owner`: Franky, Zoro, Chopper, Usopp, Luffy u otro Mugiwara responsable.
- `recommended_next_step`: texto read-only, sin ejecutar nada.
- `playbook_link` o enlace interno allowlisted si existe.
- `meta.sanitized=true`.

Ejemplos de mapeo saneado:

- `skills_source_untracked` → `skills_source_integrity`
  - Summary: “La fuente de skills requiere revisión de trazabilidad.”
  - Owner sugerido: Zoro.
  - Severidad: media si no rompe runtime.
- `horse_venue_discovery_cron_log` → `scheduled_discovery_observability`
  - Summary: “Hay una advertencia en la trazabilidad de un discovery programado.”
  - Owner sugerido: Franky.
  - Severidad: media/baja según impacto.

### Criterios de aceptación

- Si `system-healthcheck.py` está en `WARN` por categorías allowlisted, el panel no debe comunicar “todo perfecto” sin matiz.
- La UI puede mostrar “Operativo con avisos” aunque los seis checks críticos estén en `pass`.
- No aparecen paths, logs, stdout, stderr, comandos, trazas, tokens, `.env`, nombres internos sensibles ni salidas crudas.
- Si la fuente completa falla o no está disponible, el panel degrada a `unknown`/`stale`, no a `pass`.

### Owner recomendado

- Franky: semántica operativa, productores, frescura y cadencias.
- Zoro: contrato backend/read-model, tests e integración API.
- Chopper: revisión de no-leakage y frontera de seguridad.
- Usopp: copy/jerarquía visual si cambia la UI.

## Prioridad P0 — Corregir drift de roster 9 vs 10

### Problema

El dashboard reporta 9 Mugiwaras activos mientras el canon operativo y gateway status indican 10/10. Es un bug pequeño técnicamente, pero grande para la confianza: si el panel no sabe cuánta tripulación hay, el resto de agregados queda bajo sospecha.

### Propuesta

Unificar la fuente de verdad del roster en un catálogo backend-owned y usarla en Dashboard, Mugiwaras y Healthcheck.

Separar semánticamente:

- `configured_mugiwaras_count`: total canónico configurado.
- `active_mugiwaras_count`: activos en canon operativo.
- `active_gateways_count`: gateways operativos.
- `degraded_gateways_count`: gateways degradados.
- `unknown_gateways_count`: gateways sin señal suficiente.
- `roster[]`: slugs/nombres allowlisted.

Roster canónico actual:

- Luffy
- Zoro
- Franky
- Nami
- Robin
- Usopp
- Jinbe
- Sanji
- Chopper
- Brook

### Criterios de aceptación

- `/api/v1/dashboard` refleja 10 Mugiwaras activos/configurados cuando el canon está en 10.
- `/mugiwaras` lista 10.
- `/healthcheck` puede seguir mostrando `gateways 10/10` si todos están activos.
- Un gateway caído no elimina al Mugiwara del total canónico; degrada su estado de gateway.
- Hay test de contrato para evitar regresión del contador/catálogo.

### Owner recomendado

- Zoro: implementación y tests.
- Franky: validación contra manifest de gateways y canon operativo.
- Usopp: microcopy para separar “tripulación activa” de “gateways operativos”.

## Prioridad P1 — Banda superior de estado con causa principal visible

### Problema

Una parrilla de cards no siempre responde rápido qué importa. Pablo necesita una lectura ejecutiva antes del detalle técnico saneado.

### Propuesta

Añadir o reforzar en `/healthcheck` y/o Dashboard una banda superior con:

- Estado global: `Operativo`, `Operativo con avisos`, `Degradado`, `Incidencia`.
- Severidad máxima visible.
- Causa principal saneada.
- Contador de avisos/incidencias.
- Última actualización.
- Owner sugerido cuando proceda.

Jerarquía recomendada:

1. **Resumen ejecutivo:** estado global, causa principal, frescura, severidad.
2. **Checks principales:** las seis cards actuales con estado/frescura.
3. **Detalle saneado:** facts, links y advisories.

Microcopy orientativo:

- “Operativo con avisos.”
- “2 señales requieren revisión, sin incidencia crítica visible.”
- “Causa principal: fuente de skills pendiente de trazabilidad.”
- “Siguiente revisión sugerida: Zoro/Franky según propiedad.”

### Criterios de aceptación

- En menos de cinco segundos se entiende si hay que actuar.
- El estado global no oculta warnings operativos relevantes.
- La causa principal nunca incluye contenido crudo ni sensible.

### Owner recomendado

- Usopp: UX, jerarquía visual y microcopy.
- Zoro: contrato de `summary_bar`/read-model.
- Franky: semántica de causa principal.

## Prioridad P1 — Productores y fuentes del panel como read-only

### Problema

El panel depende de manifiestos saneados y productores/timers. Si esa maquinaria deja de refrescar, el panel puede mostrar información antigua o incompleta. Algunas señales ya existen indirectamente, pero falta una lectura clara de “qué alimenta el panel y si sigue fresco”.

### Propuesta

Crear una sección o read-model de **fuentes/productores del panel**.

Opciones de ubicación:

- Subbloque en `/healthcheck`.
- Endpoint específico tipo `/api/v1/healthcheck/producers`.
- Campo dentro de `healthcheck.workspace`, por ejemplo `source_producers[]`.

Campos sugeridos:

- `producer_id` allowlisted.
- `label` público.
- `owner`.
- `expected_cadence`.
- `last_observed_at`.
- `freshness_state`: `fresh`, `stale`, `unknown`.
- `status`: `pass`, `warn`, `fail`, `unknown`.
- `affected_surface`: healthcheck, dashboard, usage, vault, etc.
- `impact_summary` saneado.

Debe cubrir, cuando aplique, productores como:

- gateway status.
- cronjobs status.
- vault sync status.
- backup health status.
- project health status.
- Honcho/Docker status.
- usage snapshots.

### Criterios de aceptación

- Si un productor/timer se rompe o queda stale, el panel lo muestra como frescura degradada.
- No se exponen unidades systemd crudas, paths, logs, comandos ni stdout/stderr.
- Cada producer tiene owner y cadencia esperada.
- Hay tests de thresholds de frescura.

### Owner recomendado

- Franky: inventario de productores, cadencias e impacto operativo.
- Zoro: read-model/API/tests.
- Chopper: frontera de exposición.

## Prioridad P1 — Modelo de drift/canon mismatch

### Problema

El Control Panel agrega varias fuentes. Su riesgo más peligroso no es carecer de datos, sino mostrar datos bonitos pero incoherentes.

Drifts actuales detectados:

- Healthcheck completo en `WARN` vs panel en `PASS`.
- Dashboard roster `9` vs canon/gateways `10`.

### Propuesta

Añadir una familia pequeña de checks de coherencia interna, por ejemplo:

- `roster_canon_vs_dashboard`.
- `gateway_manifest_vs_roster`.
- `healthcheck_summary_vs_ops_advisory`.
- `read_model_contract_vs_api_shape` como fase posterior si aporta valor.

Campos sugeridos:

- `gap_id` allowlisted.
- `status`: `coherent`, `drift_detected`, `unknown`.
- `severity`.
- `public_summary`.
- `affected_section`.
- `recommended_next_action`.
- `first_seen_at` / `last_seen_at` si existe histórico saneado.

### Criterios de aceptación

- Detecta mismatch de conteo de roster.
- Detecta que el estado saneado está ocultando advisories allowlisted.
- No bloquea el panel; lo marca como “requiere revisión”.
- No expone dumps ni diferencias crudas.

### Owner recomendado

- Franky + Zoro.
- Chopper si se comparan fuentes con riesgo de leakage.

## Prioridad P2 — Acción recomendada read-only por check/advisory

### Problema

Cuando algo está `warn` o `stale`, el operador necesita saber qué hacer. Pero el MVP no debe ejecutar acciones ni abrir superficie peligrosa.

### Propuesta

Añadir campos allowlisted por check/advisory:

- `recommended_next_step`.
- `suggested_owner`.
- `escalation_target`.
- `playbook_link` interno y allowlisted.

Ejemplos:

- “Revisar gobierno de skills antes de limpiar artefactos.”
- “Esperar el siguiente ciclo; si persiste, revisar frescura del productor.”
- “Escalar a Chopper si aparece riesgo de secreto/log.”

### Criterios de aceptación

- No hay botones de `restart`, `fix`, `run`, `clean`, `sync` ni similares.
- Las acciones son orientación y enlaces documentales, no ejecución.
- El copy distingue entre “revisar”, “vigilar”, “escalar” e “incidencia”.

### Owner recomendado

- Franky: copy operativo base.
- Robin: consolidación documental si se convierte en playbook.
- Usopp: claridad del texto visible.
- Zoro: contrato/API.

## Prioridad P2 — Historial mínimo saneado

### Problema

La vista actual es una foto. Para priorizar, interesa saber si un warning es puntual o persistente, sin leer logs ni eventos crudos.

### Propuesta

Guardar y exponer snapshots saneados de corta retención.

Campos seguros:

- timestamp.
- estado agregado.
- checks que cambiaron por ID allowlisted.
- duración aproximada en `warn`/`fail`.
- recurrencias por ventana temporal.
- freshness agregada.

No guardar ni exponer:

- logs.
- stdout/stderr.
- raw output.
- rutas.
- comandos.
- nombres de ficheros no allowlisted.
- prompts.
- chat IDs.
- secretos.

### Criterios de aceptación

- Retención corta y definida.
- Schema público y saneado.
- Endpoint read-only sin selector arbitrario de paths/fuentes.
- Útil para distinguir ruido puntual de degradación persistente.

### Owner recomendado

- Brook: diseño de agregación/histórico si crece.
- Franky: señales operativas.
- Zoro: almacenamiento/API/tests.
- Chopper: privacidad y no-leakage.

## Prioridad P2 — Vista Pablo y vista técnica saneada

### Problema

Una misma pantalla puede servir a Pablo para orientación rápida y a Zoro/Franky para diagnóstico seguro. Si todo se mezcla, se vuelve densa; si se simplifica demasiado, pierde utilidad.

### Propuesta

Mantener dos niveles de lectura, sin permisos nuevos ni escritura:

**Vista Pablo:**

- estado global.
- causa principal.
- 3 avisos prioritarios.
- owner sugerido.
- contadores clave.
- links a superficie relacionada.

**Vista técnica saneada:**

- todas las cards.
- freshness.
- source labels saneados.
- facts allowlisted.
- contrato/detalle de datos cuando aporte.

### Criterios de aceptación

- Ambas vistas son read-only.
- Ninguna expone host internals.
- La vista Pablo no obliga a interpretar ruido técnico.
- La vista técnica no se convierte en consola.

### Owner recomendado

- Usopp: UX y jerarquía.
- Zoro: estructura de componentes/read-models.
- Franky: semántica operativa.

## Prioridad P2 — Microcopy humano para estados ambiguos

### Problema

Estados como `unknown`, `stale` o `not_configured` son correctos para contratos, pero pueden sonar opacos si no se explican.

### Propuesta

Definir microcopy estándar por estado:

- `warn`: “Requiere revisión; no implica caída.”
- `stale`: “Dato antiguo. Puede que el productor no haya refrescado todavía.”
- `unknown`: “No hay señal suficiente para confirmar estado.”
- `not_configured`: “Fuente no configurada para esta vista.”
- `fail`: “Incidencia visible en una fuente saneada.”

Añadir cuando proceda:

- “Qué significa”.
- “Qué no significa”.
- Owner sugerido.
- Siguiente revisión segura.

### Criterios de aceptación

- Reduce ansiedad y ambigüedad.
- No promete reparación automática.
- No filtra detalles operativos internos.

### Owner recomendado

- Usopp: copy y diseño.
- Franky/Zoro: validación semántica.

## No hacer

Estas mejoras quedan explícitamente fuera por riesgo, duplicación o bajo valor:

- Crear un dashboard genérico nuevo que duplique `/dashboard` o `/healthcheck`.
- Ejecutar comandos desde el panel.
- Añadir botones de restart, clean, fix, sync, backup, docker restart o similares.
- Mostrar journal, tail de logs, stdout/stderr, raw outputs o traces.
- Navegar filesystem desde el navegador/API.
- Exponer paths absolutos, remotes internos, diffs, ficheros untracked, prompts, chat IDs, delivery targets, tokens, cookies, `.env` o secretos.
- Contar “Mugiwara activo” como sinónimo de “gateway operativo” o “todas sus capacidades maduras”. Son capas distintas.
- Añadir gráficos/históricos complejos antes de cerrar los gaps P0.
- Duplicar listas de roster en frontend, fixtures o docs sin fuente backend-owned común.

## Secuencia realista de implementación

1. **Cerrar P0 roster:** corregir el contador 9 vs 10 y fijar test de regresión.
2. **Cerrar P0 healthcheck:** introducir advisories saneados o normalizador equivalente para que WARN operativo no desaparezca.
3. **Refinar UI:** banda superior “Operativo con avisos”, causa principal y owner sugerido.
4. **Añadir productores/fuentes:** frescura de la maquinaria que alimenta el panel.
5. **Añadir drift checks:** coherencia entre read models y canon.
6. **Añadir acciones read-only y microcopy:** hacer los avisos accionables sin ejecutar nada.
7. **Sólo después:** histórico mínimo saneado si los warnings recurrentes lo justifican.

## Reviews recomendadas antes de implementar

- **Zoro:** arquitectura, API, read-models, tests y deuda técnica.
- **Franky:** operabilidad, producers, timers, freshness, degradación y ownership.
- **Chopper:** no-leakage, seguridad, frontera read-only y exposición de datos.
- **Usopp:** UI, UX, jerarquía visual, copy y claridad para Pablo.

## Resumen ejecutivo

El Control Panel ya tiene una base sólida. La mejora futura más útil es convertirlo en una brújula fiable: que no diga `PASS` absoluto cuando hay avisos operativos conocidos, que represente correctamente la tripulación `10/10`, que priorice lo importante y que indique quién debe mirar cada cosa sin abrir una consola ni filtrar tripas del sistema.

Primero confianza y coherencia; después densidad e histórico.

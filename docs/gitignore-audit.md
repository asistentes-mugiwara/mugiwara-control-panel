# Auditoría de `.gitignore`

## Objetivo
Tener una checklist explícita para revisar si el repo sigue protegido frente a artefactos locales o sensibles.

## Cobertura actual observada
La base actual de `.gitignore` ya cubre:
- secretos y `.env`
- claves/certificados
- outputs Python comunes
- outputs Node/frontend comunes
- artefactos de editores/OS
- bases de datos y runtime local
- reports y resultados de testing
- assets frontend privados locales
- artefactos OpenCode/agentes como `.atl/` y `.opencode/`

## Checklist de revisión por fase
- [ ] ¿Ha aparecido una carpeta nueva de tooling local?
- [ ] ¿Hay outputs de runtime nuevos que no estén ignorados?
- [ ] ¿Alguna prueba o script ha generado logs, DBs o reports nuevos?
- [ ] ¿Se han añadido assets privados o binarios locales?
- [ ] ¿Ha aparecido una ruta con datos del host o del operador?
- [ ] ¿Hay ejemplos/documentos nuevos que necesiten nota explícita de saneamiento?

## Clases que deben disparar revisión inmediata
- nuevos caches de herramientas
- nuevos exports o snapshots
- nuevos outputs de agentes o MCPs
- nuevos artefactos frontend privados
- nuevos stores temporales de testing
- nuevas rutas de datos locales dentro de `apps/`, `scripts/` o `docs/`

## Excepciones documentales
Si se desea versionar un ejemplo normalmente ignorado, debe quedar claro:
- por qué se incluye
- que está saneado
- que no es output real de operación
- qué riesgo público se revisó

## Señales de alarma
Hay que bloquear cierre si aparece cualquiera de estas:
- credenciales o secretos potenciales
- dumps o logs sensibles
- paths del host en archivos compartidos
- archivos grandes/raros no explicados
- outputs de herramientas sin política clara

## Conclusión
`.gitignore` no es un fichero estático: en este proyecto público debe auditarse cada vez que cambian herramientas, runtime o flujos de trabajo.

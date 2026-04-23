# SDD recovery contract — mugiwara-control-panel

## Contexto
En este proyecto, OpenCode/SDD puede atascarse durante `sdd-init` o perder continuidad de sesión en ejecuciones headless desde Hermes.

## Contrato operativo fijado
Cuando una fase software requiera SDD, el orden correcto es:
1. intentar `OpenCode + SDD`
2. si falla, recuperar la fase **inline** usando las skills SDD correspondientes
3. si aun así hay que continuar **fuera de OpenCode**, el trabajo manual debe seguir igualmente bajo el método SDD usando skills `sdd-*`, `strict-tdd` y `judgment-day` cuando aplique
4. cambiar de runtime **no** autoriza a salir del método

## Regla explícita
"Manual" fuera de OpenCode no significa "sin SDD".

Significa ejecutar el mismo método SDD desde Hermes/local con las skills disponibles, manteniendo:
- diseño previo razonable
- TDD/strict-tdd cuando corresponda
- verify real
- trazabilidad del recovery

## Motivo
Se fija esta regla para evitar repetir cierres técnicamente válidos pero metodológicamente fuera del canon acordado para Zoro en `mugiwara-control-panel`.

## Aplicación
- anotar en los closeouts cuando una fase se recupere fuera de OpenCode
- indicar qué skill SDD se usó en el rescate
- distinguir siempre incidencia de runtime de contenido técnico real

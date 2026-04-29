# Issue 121 — planning closeout

## Resultado
Se planifica #121 como bloque de rediseño Vault dividido en cuatro microfases: backend explorer tree, backend document reader raw Markdown, frontend explorer + reader, y responsive/guardrails/canon.

## Hallazgos
- El backend actual ya tiene root fijo `/srv/crew-core/vault`, rechazo de traversal/symlink/extensiones y tests de no-leakage, pero sigue siendo una allowlist editorial de tres documentos.
- La UI actual de `/vault` es exactamente lo que #121 quiere sustituir: cards editoriales, metadata externa, índice allowlisted visual y documento por secciones truncadas.
- `npm run verify:vault-server-only` ya falla en `main` por un literal histórico (`Estado de API`) y debe actualizarse cuando se toque Vault.

## Continuidad
Siguiente paso técnico: microfase 121.1 en rama `zoro/issue-121-1-vault-tree`, empezando por tests backend para árbol seguro y contrato de explorer read-only.

## Riesgo principal
No mezclar la UI nueva con filesystem dinámico inseguro. Primero cerrar backend contract + document reader con Chopper, después UI con Usopp + Chopper.

# Verify checklist — phase 5 skills surface

## Comprobaciones mínimas
- [ ] La única escritura del MVP sigue siendo skills autorizadas.
- [ ] La allowlist está definida como responsabilidad de backend, no del cliente.
- [ ] No existe path libre enviado por el frontend como fuente de verdad.
- [ ] La edición queda protegida contra path traversal y salidas del árbol permitido.
- [ ] La auditoría mínima incluye actor, skill, ruta resuelta, diff y resultado.
- [ ] Git no se usa como sustituto de la auditoría operacional.
- [ ] No se amplía la superficie de escritura a vault, memoria o código del producto.

## Verify de método SDD observado
- [ ] Confirmar si la fase arrancó desde continuidad de sesión sin reabrir `sdd-init`.
- [ ] Confirmar si la sesión raíz permaneció en `sdd-orchestrator-zoro` o derivó a `build`.
- [ ] Documentar cualquier rescate inline si el flujo no cerró de extremo a extremo.
- [ ] No afirmar persistencia útil en Engram sin evidencia en `observations`.

## Criterio de cierre
La fase puede cerrarse documentalmente si deja limitada la superficie editable, define trazabilidad mínima y deja trazada cualquier desviación real del método SDD.

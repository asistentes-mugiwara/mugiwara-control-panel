# Runtime readiness smoke — private v1

## Contexto
Tras PR #94 e Issue #40 cerrada, se ejecutó el smoke pequeño de runtime readiness recomendado por el Project Summary del vault para decidir si `mugiwara-control-panel` puede declararse operativo privado v1.

## Alcance ejecutado
Smoke sin features nuevas:
- web + API en loopback;
- `/healthcheck` backend y frontend;
- timers/manifests reales Healthcheck;
- guardrails principales;
- no-leakage básico.

## Resultado
Listo para declarar **operativo privado v1** bajo perímetro privado/local/Tailscale, sin soporte internet-public.

Evidencia principal:
- Guardrails de perímetro, Healthcheck producers/runners, Healthcheck/Dashboard server-only y Git server-only pasaron.
- `npm --prefix apps/web run typecheck` pasó.
- `PYTHONPATH=. pytest apps/api/tests -q` pasó con `129 passed`.
- `npm --prefix apps/web run build` pasó y `/healthcheck` quedó dinámica.
- FastAPI `GET /api/v1/healthcheck` respondió `200`, `status=ready`, `meta.sanitized=true`, seis módulos reales en `pass/low`.
- Next production `/healthcheck` respondió `200`, renderizó módulos reales y no tuvo errores de consola en browser smoke.
- Cinco timers Healthcheck user-level activos.
- Cinco manifests reales JSON con permisos `0640` y no-leakage básico `PASS`.

## Hallazgo operativo
El smoke de no-leakage web debe ejecutarse sobre `next build` + `next start`, no sobre `next dev`: en dev mode el HTML/RSC puede contener datos propios del runtime de desarrollo como URL de fetch y `fileName` con rutas fuente, generando falsos positivos que no representan el bundle production.

## Restricciones vivas
No se añadieron fuentes Healthcheck, capacidades Git, runtime changes, timers, manifests, permisos, UI nueva ni auth pública. La declaración v1 privada no cubre exposición pública, carga/performance ni nuevas capacidades.

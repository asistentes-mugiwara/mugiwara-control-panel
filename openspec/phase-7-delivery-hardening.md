# Phase 7 — delivery hardening

## Scope
Cerrar la base de entrega segura del repo: `.gitignore`, documentación viva, trazabilidad y preparación para fases de implementación.

## Decisions
- La gobernanza de entrega se trata como política repo-wide, no como checklist aislada.
- `.gitignore` se revisa por clases de artefacto, no solo por rutas conocidas históricas.
- El cierre de fase exige higiene de worktree y separación clara de alcance.
- La trazabilidad de decisiones es requisito previo para crecer en implementación sin deriva documental.
- `verify` y `archive` no se declaran completados en esta mini-fase.

## Traceability matrix
| Fuente SDD | Resultado materializado |
|---|---|
| Proposal `sdd/phase-7-delivery-hardening/proposal` | `docs/delivery-hardening.md` |
| Explore `sdd/roadmap-phase-7-delivery-hardening/explore` | `docs/gitignore-audit.md` |
| Spec `sdd/phase-7-delivery-hardening/spec` | `openspec/phase-7-verify-checklist.md` |
| Design `sdd/phase-7-delivery-hardening/design` | `openspec/phase-7-delivery-hardening.md` |
| Tasks `sdd/phase-7-delivery-hardening/tasks` | lista de artefactos y criterios de materialización |

## Definition of done
- política de entrega endurecida documentada
- auditoría de `.gitignore` expresada como checklist usable
- límites de cierre y worktree hygiene definidos
- closeout en `.engram/` con método, riesgos y siguiente paso

## Verify expected
- revisión de `.gitignore` por clases de artefactos
- worktree revisable y sin mezclas ambiguas de alcance al cerrar
- coherencia entre `README.md`, `AGENTS.md`, `docs/` y `openspec/` cuando cambian reglas
- ausencia de claims falsos sobre `verify` o `archive`

## Método observado en esta fase
- La continuación se lanzó usando el wrapper seguro con `--session` y `--agent sdd-orchestrator-zoro`.
- La sesión raíz permaneció en `sdd-orchestrator-zoro`.
- Se observaron cierres útiles de `sdd-explore-zoro`, `sdd-propose-zoro`, `sdd-spec-zoro`, `sdd-design-zoro` y `sdd-tasks-zoro`.
- `sdd-apply-zoro` fue lanzado pero no dejó materialización observable dentro de la ventana, así que el cierre documental se rescató inline usando artefactos ya persistidos en Engram.
- Se observó una desviación de topic-key: `explore` persistió bajo `sdd/roadmap-phase-7-delivery-hardening/explore`, mientras proposal/spec/design/tasks usaron `sdd/phase-7-delivery-hardening/*`.

## Current worktree evidence
Durante la exploración de fase 7 se observó worktree no limpio por cambios tracked en:
- `docs/development.md`
- `scripts/opencode-safe-run.sh`

Esos cambios forman parte del endurecimiento metodológico y deben integrarse o separarse explícitamente al cerrar, no ignorarse.

## Next SDD phases
- siguiente paso lógico: implementación inicial con `sdd-apply` real sobre código cuando se decida
- mantener `sdd-verify` como gate futuro obligatorio
- no reclamar `sdd-archive` como completado en esta mini-fase documental

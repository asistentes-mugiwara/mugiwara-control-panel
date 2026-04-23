# Fase 1 - Decisiones de diseño

## Decisiones cerradas
- Monolito modular como forma principal del sistema.
- Frontend con Next.js en `apps/web`.
- Backend con FastAPI en `apps/api`.
- Contratos compartidos en `packages/contracts`.
- UI compartida solo si se vuelve necesaria de forma real.
- Acceso remoto mediante Tailscale.
- MVP read-only por defecto; la única superficie de escritura autorizada son las skills permitidas.

## Razones de diseño
- Reducir coordinación entre piezas y mantener límites claros para agentes.
- Concentrar la frontera de seguridad en el backend.
- Evitar ampliar superficies de escritura antes de que exista una necesidad operativa demostrada.
- Favorecer contratos explícitos, tipados y estables para consumo automático.

## Implicaciones
- La UI debe comportarse como visor y orquestador de lectura.
- Cualquier mutación fuera de skills requiere decisión explícita posterior.
- La documentación y `AGENTS.md` son parte del sistema, no anexos opcionales.
- `.gitignore` tiene que tratarse como parte del hardening del producto público.

## Riesgos asumidos
- La disciplina read-only puede ralentizar funcionalidades futuras si no se preservan bien los límites.
- El monolito modular exige mantener separación real de capas para no degradar en acoplamiento accidental.
- Un repo público amplifica el coste de cualquier fuga de artefactos locales o secretos.

## Criterio de salida de fase 1
- La arquitectura base está documentada.
- La seguridad documental y de ignorados está explícita.
- Los límites de edición están restringidos a skills permitidas.
- Queda listo el terreno para pasar a implementación sin rehacer decisiones estructurales.

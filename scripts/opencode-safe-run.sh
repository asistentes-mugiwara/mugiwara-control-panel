#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  scripts/opencode-safe-run.sh --title "Mi fase" --prompt-file /ruta/prompt.md [--agent sdd-orchestrator-zoro] [--dir /ruta/proyecto]
  scripts/opencode-safe-run.sh --session <session-id> --prompt-file /ruta/prompt.md [--agent sdd-orchestrator-zoro] [--dir /ruta/proyecto]

Descripción:
  Ejecuta `opencode run` leyendo el prompt desde fichero para evitar que Bash
  interprete backticks, comillas o rutas antes de que OpenCode procese el texto.

Notas:
  - pensado para invocaciones seguras y explícitas
  - si continúas una sesión SDD headless, pasa también `--agent sdd-orchestrator-zoro`
  - no resuelve por sí solo cuellos de botella del runtime SDD
  - no cierres una fase como "persistida en Engram" sin auditar observaciones reales
EOF
}

TITLE=""
SESSION_ID=""
PROMPT_FILE=""
AGENT="sdd-orchestrator-zoro"
PROJECT_DIR="$(pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)
      TITLE="$2"
      shift 2
      ;;
    --session)
      SESSION_ID="$2"
      shift 2
      ;;
    --prompt-file)
      PROMPT_FILE="$2"
      shift 2
      ;;
    --agent)
      AGENT="$2"
      shift 2
      ;;
    --dir)
      PROJECT_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Argumento no reconocido: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$PROMPT_FILE" ]]; then
  echo "Falta --prompt-file" >&2
  usage >&2
  exit 2
fi

if [[ -z "$TITLE" && -z "$SESSION_ID" ]]; then
  echo "Debes pasar --title o --session" >&2
  usage >&2
  exit 2
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "No existe el prompt file: $PROMPT_FILE" >&2
  exit 2
fi

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "No existe el directorio de proyecto: $PROJECT_DIR" >&2
  exit 2
fi

cd "$PROJECT_DIR"
CMD=(opencode run --agent "$AGENT" --dir "$PROJECT_DIR" --dangerously-skip-permissions)

if [[ -n "$SESSION_ID" ]]; then
  CMD+=(--session "$SESSION_ID")
else
  CMD+=(--title "$TITLE")
fi

CMD+=("$(cat "$PROMPT_FILE")")
"${CMD[@]}"

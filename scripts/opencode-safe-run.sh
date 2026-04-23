#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  scripts/opencode-safe-run.sh --title "Mi fase" --prompt-file /ruta/prompt.md [--agent sdd-orchestrator-zoro] [--dir /ruta/proyecto]

Descripción:
  Ejecuta `opencode run` leyendo el prompt desde fichero para evitar que Bash
  interprete backticks, comillas o rutas antes de que OpenCode procese el texto.

Notas:
  - pensado para invocaciones seguras y explícitas
  - no resuelve por sí solo cuellos de botella del runtime SDD
  - no cierres una fase como "persistida en Engram" sin auditar observaciones reales
EOF
}

TITLE=""
PROMPT_FILE=""
AGENT="sdd-orchestrator-zoro"
PROJECT_DIR="$(pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)
      TITLE="$2"
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

if [[ -z "$TITLE" || -z "$PROMPT_FILE" ]]; then
  echo "Faltan --title o --prompt-file" >&2
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
opencode run \
  --agent "$AGENT" \
  --dir "$PROJECT_DIR" \
  --title "$TITLE" \
  --dangerously-skip-permissions \
  "$(cat "$PROMPT_FILE")"

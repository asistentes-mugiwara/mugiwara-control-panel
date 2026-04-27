#!/usr/bin/env bash
# Run the private Mugiwara Control Panel FastAPI backend for user-level systemd.
set -euo pipefail

repo_root="/srv/crew-core/projects/mugiwara-control-panel"
api_host="${MUGIWARA_CONTROL_PANEL_API_HOST:-127.0.0.1}"
api_port="${MUGIWARA_CONTROL_PANEL_API_PORT:-8011}"
python_bin="${MUGIWARA_CONTROL_PANEL_PYTHON:-/home/agentops/.hermes/hermes-agent/venv/bin/python3}"

if [[ "$api_host" != "127.0.0.1" ]]; then
  echo "Refusing to expose Control Panel API outside loopback: $api_host" >&2
  exit 64
fi

cd "$repo_root"
exec /usr/bin/env PYTHONPATH=. "$python_bin" -m uvicorn apps.api.src.main:app --host "$api_host" --port "$api_port"

#!/usr/bin/env bash
# Run the private Mugiwara Control Panel Next.js frontend for user-level systemd.
set -euo pipefail

repo_root="/srv/crew-core/projects/mugiwara-control-panel"
web_port="${MUGIWARA_CONTROL_PANEL_WEB_PORT:-3017}"
api_url="${MUGIWARA_CONTROL_PANEL_API_URL:-http://127.0.0.1:8011}"
web_host="${MUGIWARA_CONTROL_PANEL_WEB_HOST:-}"

if [[ "$api_url" != "http://127.0.0.1:8011" ]]; then
  echo "Refusing unexpected backend URL for private service: $api_url" >&2
  exit 64
fi

if [[ -z "$web_host" ]]; then
  if command -v tailscale >/dev/null 2>&1; then
    web_host="$(tailscale ip -4 2>/dev/null | head -n 1 || true)"
  fi
fi

if [[ -z "$web_host" ]]; then
  if [[ "${MUGIWARA_CONTROL_PANEL_ALLOW_LOCALHOST_FALLBACK:-}" == "1" ]]; then
    web_host="127.0.0.1"
  else
    echo "No Tailscale IPv4 detected. Refusing to start web service without private Tailscale bind." >&2
    exit 75
  fi
fi

if [[ "$web_host" == "0.0.0.0" || "$web_host" == "::" ]]; then
  echo "Refusing wildcard bind for private Control Panel web service: $web_host" >&2
  exit 64
fi

cd "$repo_root"
if [[ ! -f apps/web/.next/BUILD_ID ]]; then
  echo "Missing Next production build. Run npm --prefix apps/web run build or installer first." >&2
  exit 78
fi

export MUGIWARA_CONTROL_PANEL_API_URL="$api_url"
exec /usr/bin/env npm --prefix apps/web run start -- --hostname "$web_host" --port "$web_port"

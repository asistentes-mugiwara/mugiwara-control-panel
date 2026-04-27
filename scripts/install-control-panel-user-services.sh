#!/usr/bin/env bash
# Install and enable Mugiwara Control Panel private API + Tailscale web user services.
set -euo pipefail

repo_root="/srv/crew-core/projects/mugiwara-control-panel"
unit_source_dir="$repo_root/ops/systemd/user"
unit_target_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
api_service="mugiwara-control-panel-api.service"
web_service="mugiwara-control-panel-web.service"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Install and enable the Mugiwara Control Panel private user services.

Usage:
  scripts/install-control-panel-user-services.sh

Contract:
  - installs user units under ~/.config/systemd/user
  - builds the Next.js production app before starting web
  - enables and starts mugiwara-control-panel-api.service
  - enables and starts mugiwara-control-panel-web.service
  - API binds only to 127.0.0.1:8011
  - Web binds to the current Tailscale IPv4 on port 3017 by default
  - Web uses MUGIWARA_CONTROL_PANEL_API_URL=http://127.0.0.1:8011 server-side
  - does not use wildcard bind, Tailscale Funnel, public internet exposure or alternate backend URL
USAGE
  exit 0
fi

for unit in "$api_service" "$web_service"; do
  if [[ ! -f "$unit_source_dir/$unit" ]]; then
    echo "missing unit source: $unit_source_dir/$unit" >&2
    exit 1
  fi
done

if ! command -v tailscale >/dev/null 2>&1; then
  echo "tailscale command not found; refusing private Tailscale service install" >&2
  exit 1
fi

tailscale_ip="$(tailscale ip -4 2>/dev/null | head -n 1 || true)"
if [[ -z "$tailscale_ip" ]]; then
  echo "no Tailscale IPv4 available; refusing install" >&2
  exit 1
fi

cd "$repo_root"
npm --prefix apps/web run build

install -d -m 0750 "$unit_target_dir"
install -m 0644 "$unit_source_dir/$api_service" "$unit_target_dir/$api_service"
install -m 0644 "$unit_source_dir/$web_service" "$unit_target_dir/$web_service"

systemctl --user daemon-reload
systemctl --user enable --now "$api_service"
systemctl --user enable --now "$web_service"
systemctl --user --no-pager --full status "$api_service" "$web_service" || true
printf 'Control Panel private URL: http://%s:3017
' "$tailscale_ip"

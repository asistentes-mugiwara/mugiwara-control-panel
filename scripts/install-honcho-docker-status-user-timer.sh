#!/usr/bin/env bash
# Install the user-level systemd timer that refreshes the safe Honcho/Docker status manifests.
set -euo pipefail

repo_root="/srv/crew-core/projects/mugiwara-control-panel"
unit_source_dir="$repo_root/ops/systemd/user"
unit_target_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
service_name="mugiwara-honcho-docker-status.service"
timer_name="mugiwara-honcho-docker-status.timer"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Install and enable the Mugiwara Control Panel Honcho/Docker status user timer.

Usage:
  scripts/install-honcho-docker-status-user-timer.sh

Contract:
  - installs user units under ~/.config/systemd/user
  - enables and starts mugiwara-honcho-docker-status.timer
  - runs npm run write:docker-runtime-status and npm run write:honcho-status from /srv/crew-core/projects/mugiwara-control-panel
  - refreshes every 2 minutes after boot with a small randomized delay
  - Docker producer only checks allowlisted critical containers
  - Honcho producer reads only the sanitized Docker manifest and fixed local /health endpoint
  - does not pass --output, --docker-runtime-manifest or other alternate paths
  - does not inspect Docker logs/inspect, compose env files, credentials, stdout/stderr, raw payloads or host details
USAGE
  exit 0
fi

for unit in "$service_name" "$timer_name"; do
  if [[ ! -f "$unit_source_dir/$unit" ]]; then
    echo "missing unit source: $unit_source_dir/$unit" >&2
    exit 1
  fi
done

install -d -m 0750 "$unit_target_dir"
install -m 0644 "$unit_source_dir/$service_name" "$unit_target_dir/$service_name"
install -m 0644 "$unit_source_dir/$timer_name" "$unit_target_dir/$timer_name"

systemctl --user daemon-reload
systemctl --user enable --now "$timer_name"
systemctl --user list-timers "$timer_name" --no-pager

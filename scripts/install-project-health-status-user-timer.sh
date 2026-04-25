#!/usr/bin/env bash
# Install the user-level systemd timer that refreshes the safe project-health manifest.
# The installed unit uses the producer default output path and intentionally does not run git fetch.
set -euo pipefail

repo_root="/srv/crew-core/projects/mugiwara-control-panel"
unit_source_dir="$repo_root/ops/systemd/user"
unit_target_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
service_name="mugiwara-project-health-status.service"
timer_name="mugiwara-project-health-status.timer"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Install and enable the Mugiwara Control Panel project-health user timer.

Usage:
  scripts/install-project-health-status-user-timer.sh

Contract:
  - installs user units under ~/.config/systemd/user
  - enables and starts mugiwara-project-health-status.timer
  - runs npm run write:project-health-status from /srv/crew-core/projects/mugiwara-control-panel
  - does not run git fetch and does not pass --output; remote_synced compares HEAD to the local upstream ref
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

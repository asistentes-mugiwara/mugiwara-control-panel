#!/usr/bin/env bash
# Install the user-level systemd timer that refreshes the safe vault-sync status manifest.
# The installed unit uses the producer default source and output path; it does not pass path overrides.
set -euo pipefail

repo_root="/srv/crew-core/projects/mugiwara-control-panel"
unit_source_dir="$repo_root/ops/systemd/user"
unit_target_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
service_name="mugiwara-vault-sync-status.service"
timer_name="mugiwara-vault-sync-status.timer"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Install and enable the Mugiwara Control Panel vault-sync status user timer.

Usage:
  scripts/install-vault-sync-status-user-timer.sh

Contract:
  - installs user units under ~/.config/systemd/user
  - enables and starts mugiwara-vault-sync-status.timer
  - runs npm run write:vault-sync-status from /srv/crew-core/projects/mugiwara-control-panel
  - refreshes every 20 minutes after boot with a small randomized delay
  - the service timeout is 620s, aligned with the producer internal 600s timeout
  - the producer runs the fixed /srv/crew-core/scripts/vault-sync.sh source and writes the fixed vault-sync-status manifest
  - does not pass --output, --sync-script, --timeout-seconds or any alternate paths to the producer
  - does not serialize stdout/stderr, raw output, logs, paths, branches, remotes, tokens, credentials or .env values
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

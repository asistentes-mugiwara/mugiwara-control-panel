#!/usr/bin/env bash
# Install the user-level systemd timer that refreshes the safe backup-health status manifest.
# The installed unit uses the producer default source and output path; it does not pass path overrides.
set -euo pipefail

repo_root="/srv/crew-core/projects/mugiwara-control-panel"
unit_source_dir="$repo_root/ops/systemd/user"
unit_target_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
service_name="mugiwara-backup-health-status.service"
timer_name="mugiwara-backup-health-status.timer"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Install and enable the Mugiwara Control Panel backup-health status user timer.

Usage:
  scripts/install-backup-health-status-user-timer.sh

Contract:
  - installs user units under ~/.config/systemd/user
  - enables and starts mugiwara-backup-health-status.timer
  - runs npm run write:backup-health-status from /srv/crew-core/projects/mugiwara-control-panel
  - refreshes every 8 hours after boot with a randomized delay
  - the service timeout is 120s
  - the producer observes the fixed backup artifact source and writes the fixed backup-health-status manifest
  - does not pass --output, --backups-dir or any alternate paths to the producer
  - does not run backups, system-backup.sh, tar, zstd, Drive upload tooling or rclone
  - does not serialize archive names, backup paths, included paths, hashes, sizes, stdout/stderr, logs, raw output, tokens, credentials or .env values
USAGE
  exit 0
fi

if [[ $# -ne 0 ]]; then
  echo "usage: scripts/install-backup-health-status-user-timer.sh" >&2
  exit 2
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
